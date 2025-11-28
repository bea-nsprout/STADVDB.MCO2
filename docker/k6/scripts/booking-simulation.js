import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  scenarios: {
    same_seat_race: {
      executor: "constant-arrival-rate",
      rate: 50,
      timeUnit: "1s",
      duration: "10s",
      preAllocatedVUs: 50,
      maxVUs: 500,
      exec: "bookSameSeat"
    }
  }
};

const FIXED = {
  train: 1,
  journey: 1,
  classType: "Economy",
  car: 3,
  row: 1,
  col: 1
};

const FROM = "Tokyo";
const TO = "Kyoto";

export function bookSameSeat() {
  const payload = {
    train: FIXED.train,
    classType: FIXED.classType,
    stationFrom: FROM,
    stationTo: TO,
    selectedSeats: [
      {
        car: FIXED.car,
        row: FIXED.row,
        col: FIXED.col
      }
    ],
    journey: FIXED.journey,
    cost: 500,
    email: `race_${__VU}_${__ITER}@example.com`,
    cost_total: 500
  };

  const res = http.post(
    "http://web:5173/api/bookings",
    JSON.stringify(payload),
    { headers: { "Content-Type": "application/json" } }
  );

  check(res, {
    "success OR seat conflict": r => r.status === 200 || r.status === 400
  });

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    "/results/book_same_seat.html": htmlReport(data)
  };
}