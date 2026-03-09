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

        String title = call.getString("title", "Shopping Reminder - My Easy List");
        String description = call.getString("description", "");
        Long startTime = call.getLong("startTime");
        Long endTime = call.getLong("endTime");

        Intent intent = new Intent(Intent.ACTION_INSERT)
                .setData(CalendarContract.Events.CONTENT_URI)
                .putExtra(CalendarContract.Events.TITLE, title);

        if (description != null && !description.isEmpty()) {
            intent.putExtra(CalendarContract.Events.DESCRIPTION, description);
        }

        if (startTime != null) {
            intent.putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startTime);
        }

        if (endTime != null) {
            intent.putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endTime);
        }

        if (intent.resolveActivity(getActivity().getPackageManager()) != null) {
            getActivity().startActivity(intent);
            call.resolve();
            return;
        }

        call.reject("No calendar app found");
    }
}