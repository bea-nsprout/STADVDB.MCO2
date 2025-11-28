import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const stations = ["Tokyo", "Shin-Yokohama", "Nagoya", "Kyoto"];
const classes = ["Economy", "Business", "First"];
const timeWindows = [
    ["2025-11-28T09:00:00.000Z", "2025-11-28T10:00:00.000Z"],
    ["2025-11-28T10:00:00.000Z", "2025-11-28T11:00:00.000Z"],
    ["2025-11-28T13:00:00.000Z", "2025-11-28T14:00:00.000Z"],
    ["2025-11-28T15:00:00.000Z", "2025-11-28T16:00:00.000Z"]
];

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export const options = {
    scenarios: {
        train_search: {
            executor: "ramping-arrival-rate",
            startRate: 10,
            timeUnit: "1s",
            preAllocatedVUs: 20,
            maxVUs: 200,
            stages: [
                { target: 50, duration: "20s" },
                { target: 100, duration: "20s" },
                { target: 150, duration: "20s" },
                { target: 200, duration: "20s" }
            ],
            exec: "searchTrains"
        }
    },

    thresholds: {
        "http_req_failed{scenario:train_search}": [
            { threshold: "rate<0.05", abortOnFail: true }
        ],
        "http_req_duration{scenario:train_search}": [
            { threshold: "p(95)<2000", abortOnFail: true }
        ]
    }
};

export function searchTrains() {
    let from = pick(stations);
    let to = pick(stations);
    while (to === from) to = pick(stations);

    const cls = pick(classes);
    const [startISO, endISO] = pick(timeWindows);

    const url =
        `http://web:5173/api/trainSchedules` +
        `?from=${from}&to=${to}&type=departure&cls=${cls}` +
        `&timeStart=${startISO}&timeEnd=${endISO}`;

    const res = http.get(url);

    check(res, {
        "status 200": r => r.status === 200,
        "response < 500ms": r => r.timings.duration < 500
    });

    sleep(0.2);
}

export function handleSummary(data) {
    return {
        "/results/train_search.html": htmlReport(data)
    };
}
