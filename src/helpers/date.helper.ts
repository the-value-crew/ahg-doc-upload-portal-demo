import moment from "moment"

export const timestampToStr = (timestamp: number) => {
    return moment(timestamp, 'x').format("DD MMM YYYY");
}