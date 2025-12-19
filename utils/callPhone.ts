const pushPhoneUrl = process.env.PUSH_PHONE_URL!;
const phoneToken = process.env.PHONE;

export function callPhone() {
  console.log("📞 调用电话");
  fetch(`${pushPhoneUrl}?message=cs更新通知&targets=${phoneToken}`);
}
