import UIKit
import Capacitor
import FirebaseCore

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var calendarPluginRegistered = false

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        FirebaseApp.configure()

        registerCalendarPluginWithRetry()

        return true
    }

    private func registerCalendarPluginWithRetry() {
        let delays: [Double] = [0.2, 0.7, 1.5, 3.0]

        for delay in delays {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                self.registerCalendarPluginIfNeeded()
            }
        }
    }

    private func registerCalendarPluginIfNeeded() {
        if calendarPluginRegistered {
            return
        }

        guard
            let bridgeVC = self.window?.rootViewController as? CAPBridgeViewController,
            let bridge = bridgeVC.bridge
        else {
            print("CALENDAR_PLUGIN_REGISTER_WAITING_FOR_BRIDGE")
            return
        }

        bridge.registerPluginInstance(CalendarPlugin())
        calendarPluginRegistered = true
        print("CALENDAR_PLUGIN_REGISTERED_FROM_APPDELEGATE")
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        registerCalendarPluginWithRetry()
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(
            app,
            open: url,
            options: options
        )
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }
}
