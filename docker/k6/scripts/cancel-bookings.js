import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const real_failures = new Rate("real_failures");

export const options = {
  scenarios: {
    cancel_bookings: {
      executor: "constant-arrival-rate",
      rate: 30,
      timeUnit: "1s",
      duration: "20s",
      preAllocatedVUs: 10,
      maxVUs: 50,
      exec: "cancelBookings",
    },
  },

  // 🚫 Do NOT check http_req_failed. It is meaningless for DELETE tests.
  thresholds: {
    real_failures: ["rate==0"], // Only fail the test on true errors (500, network errors)
  },
};

export function cancelBookings() {
  const id = Math.floor(Math.random() * 50000) + 1;
  const payload = JSON.stringify({ bookingID: String(id) });

  const res = http.del("http://web:5173/api/bookings", payload, {
    headers: { "Content-Type": "application/json" },
    throw: false,
  });

  const ok = res.status === 200 || res.status === 404;

  if (__VU === 1 && __ITER === 0) {
    console.log("Sample DELETE:", res.status, res.body?.slice(0, 200));
  }

  real_failures.add(!ok);

  check(res, {
    "200 or 404 (valid outcome)": () => ok,
    "no internal server error": () => res.status !== 500,
  });

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    "/results/cancel_bookings.html": htmlReport(data),
  };
}