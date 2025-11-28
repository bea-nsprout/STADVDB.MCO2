import http from "k6/http";
import { check, sleep } from "k6";

const stations = ["Tokyo", "Shin-Yokohama", "Toyohashi", "Nagoya", "Kyoto", "Shin-Osaka"];
const classes = ["First", "Business", "Economy"];

const trains = 10;
const journeys = 220;

const classData = {
  First:    { cars: [1], seats: 16, rows: 8,  cols: 2 },
  Business: { cars: [2], seats: 64, rows: 16, cols: 4 },
  Economy:  { cars: [3,4,5], seats: 240, rows: 16, cols: 5 }
};

const seatsPerTrain =
  classData.First.seats +
  classData.Business.seats +
  classData.Economy.seats;

const seatsPerJourney = seatsPerTrain * trains;
const totalSeats = seatsPerJourney * journeys;

let counter = 0;

export const options = {
  scenarios: {
    create_bookings: {
      executor: "constant-arrival-rate",
      rate: 20,
      timeUnit: "1s",
      duration: "20s",
      preAllocatedVUs: 20,
      maxVUs: 100,
      exec: "createBooking"
    }
  }
};

function stationPair() {
  let from = stations[Math.floor(Math.random() * stations.length)];
  let to   = stations[Math.floor(Math.random() * stations.length)];
  while (to === from) {
    to = stations[Math.floor(Math.random() * stations.length)];
  }
  return { from, to };
}

function carPk(train, car_no) {
  return (train - 1) * 5 + car_no;
}

function seatFromCounter(i) {
  const journey = Math.floor(i / seatsPerJourney) + 1;
  i %= seatsPerJourney;

  const train = Math.floor(i / seatsPerTrain) + 1;
  i %= seatsPerTrain;

  if (i < classData.First.seats) {
    return decodeSeat(i, journey, train, "First", classData.First);
  }
  i -= classData.First.seats;

  if (i < classData.Business.seats) {
    return decodeSeat(i, journey, train, "Business", classData.Business);
  }
  i -= classData.Business.seats;

  return decodeSeat(i, journey, train, "Economy", classData.Economy);
}

function decodeSeat(i, journey, train, classType, d) {
  const seatsPerCar = d.rows * d.cols;
  const carIndex = Math.floor(i / seatsPerCar);
  const carNo = d.cars[carIndex];
  const car = carPk(train, carNo);

  i %= seatsPerCar;
  const row = Math.floor(i / d.cols) + 1;
  const col = (i % d.cols) + 1;

  return { journey, train, classType, car, row, col };
}

export function createBooking() {
  const i = counter++;
  if (i >= totalSeats) return;

  const seat = seatFromCounter(i);
  const { from, to } = stationPair();

  const cost =
    seat.classType === "First" ? 1500 :
    seat.classType === "Business" ? 1000 : 500;

  const payload = {
    train: seat.train,
    classType: seat.classType,
    stationFrom: from,
    stationTo: to,
    selectedSeats: [{ car: seat.car, row: seat.row, col: seat.col }],
    journey: seat.journey,
    cost,
    email: `stress_${__VU}_${__ITER}@example.com`,
    cost_total: cost
  };

  const res = http.post(
    "http://web:5173/api/bookings",
    JSON.stringify(payload),
    { headers: { "Content-Type": "application/json" } }
  );

  check(res, {
    "200 or 409": r => r.status === 200 || r.status === 409
  });

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    "/results/create_bookings.html": htmlReport(data),
  };
}