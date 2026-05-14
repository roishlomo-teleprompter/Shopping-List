import Foundation
import Capacitor
import EventKit
import EventKitUI

@objc(CalendarPlugin)
public class CalendarPlugin: CAPPlugin, CAPBridgedPlugin, EKEventEditViewDelegate {
    public let identifier = "CalendarPlugin"
    public let jsName = "CalendarPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "openCalendar", returnType: CAPPluginReturnPromise)
    ]

    private let eventStore = EKEventStore()
    private var pendingCall: CAPPluginCall?

    @objc func openCalendar(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? "Shopping Reminder - My Easy List"
        let description = call.getString("description") ?? ""

        let nowMs = Date().timeIntervalSince1970 * 1000
        let startMs = call.getDouble("startTime") ?? nowMs + 3600 * 1000
        let endMs = call.getDouble("endTime") ?? startMs + 3600 * 1000

        let startDate = Date(timeIntervalSince1970: startMs / 1000.0)
        let endDate = Date(timeIntervalSince1970: endMs / 1000.0)

        DispatchQueue.main.async {
            self.pendingCall = call

            if #available(iOS 17.0, *) {
                self.presentEditor(title: title, description: description, startDate: startDate, endDate: endDate)
            } else {
                self.eventStore.requestAccess(to: .event) { granted, error in
                    DispatchQueue.main.async {
                        if let error = error {
                            self.pendingCall?.reject("Calendar permission failed: \(error.localizedDescription)")
                            self.pendingCall = nil
                            return
                        }

                        guard granted else {
                            self.pendingCall?.reject("Calendar permission denied")
                            self.pendingCall = nil
                            return
                        }

                        self.presentEditor(title: title, description: description, startDate: startDate, endDate: endDate)
                    }
                }
            }
        }
    }

    private func presentEditor(title: String, description: String, startDate: Date, endDate: Date) {
        let event = EKEvent(eventStore: eventStore)
        event.title = title
        event.notes = description
        event.startDate = startDate
        event.endDate = endDate

        let editor = EKEventEditViewController()
        editor.eventStore = eventStore
        editor.event = event
        editor.editViewDelegate = self

        guard let vc = bridge?.viewController else {
            pendingCall?.reject("No bridge view controller")
            pendingCall = nil
            return
        }

        vc.present(editor, animated: true)
    }

    public func eventEditViewController(_ controller: EKEventEditViewController,
                                        didCompleteWith action: EKEventEditViewAction) {
        controller.dismiss(animated: true) {
            self.pendingCall?.resolve([
                "action": self.actionName(action)
            ])
            self.pendingCall = nil
        }
    }

    private func actionName(_ action: EKEventEditViewAction) -> String {
        switch action {
        case .canceled:
            return "canceled"
        case .saved:
            return "saved"
        case .deleted:
            return "deleted"
        @unknown default:
            return "unknown"
        }
    }
}