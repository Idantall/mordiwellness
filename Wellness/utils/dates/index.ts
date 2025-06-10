import dayjs, { Dayjs } from "dayjs";

export const TIME_ZONE = "Asia/Jerusalem";

export function getDateDJ(date: string | Date | Dayjs) {
    return dayjs(date).tz(TIME_ZONE);
}
export function getNowDJ() {
  return dayjs().tz(TIME_ZONE);
}
