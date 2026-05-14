import UIKit
import Capacitor

@objc(MyViewController)
class MyViewController: CAPBridgeViewController {

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()

        bridge?.registerPluginInstance(CalendarPlugin())

        print("MY_VIEW_CONTROLLER_LOADED_CALENDAR_PLUGIN")
    }
}
