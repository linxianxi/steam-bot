export function getBeijingDateTime() {
  return new Date(
    // +8 小时
    Date.now() + 28800000
  ).toLocaleString();
}

export function getBeijingDate() {
  return new Date(
    // +8 小时
    Date.now() + 28800000
  ).toLocaleDateString();
}
