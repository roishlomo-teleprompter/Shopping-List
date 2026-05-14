import Capacitor

class MyViewController: CAPBridgeViewController {

    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(CalendarPlugin())
        print("CALENDAR_PLUGIN_REGISTERED_FROM_MYVIEWCONTROLLER")
    }
}
