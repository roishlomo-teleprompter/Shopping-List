package com.myeasylist.app;

import android.content.Intent;
import android.provider.CalendarContract;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "CalendarPlugin")
public class CalendarPlugin extends Plugin {

    @PluginMethod
    public void openCalendar(PluginCall call) {
        try {
            String title = call.getString("title", "Shopping Reminder - My Easy List");
            String description = call.getString("description", "");

            Long startTime = call.getLong("startTime");
            Long endTime = call.getLong("endTime");

            if (startTime == null) {
                startTime = System.currentTimeMillis() + 60 * 60 * 1000;
            }

            if (endTime == null) {
                endTime = startTime + 60 * 60 * 1000;
            }

            // Open native calendar event editor
            Intent intent = new Intent(Intent.ACTION_INSERT);
            intent.setType("vnd.android.cursor.item/event");
            intent.putExtra(CalendarContract.Events.TITLE, title);
            intent.putExtra(CalendarContract.Events.DESCRIPTION, description);
            intent.putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startTime);
            intent.putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endTime);

            if (intent.resolveActivity(getActivity().getPackageManager()) != null) {
                getActivity().startActivity(intent);
                call.resolve();
                return;
            }

            call.reject("No calendar app found");
        } catch (Exception e) {
            call.reject("Calendar open failed: " + e.getMessage());
        }
    }
}