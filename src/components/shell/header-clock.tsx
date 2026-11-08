import { getSettings } from "@/lib/data/settings";
import { programClock } from "@/lib/dates";
import { DayCounter } from "./day-counter";

export async function HeaderClock() {
  const settings = await getSettings();
  const clockSettings = {
    start_date: settings.start_date,
    end_date: settings.end_date,
    timezone: settings.timezone,
  };
  return <DayCounter settings={clockSettings} initial={programClock(clockSettings, new Date())} />;
}
