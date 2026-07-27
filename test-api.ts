import "dotenv/config";
import fetch from "node-fetch";

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/form-registry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "b8452331-eb79-4505-829d-476798083812",
        sourceType: "client_profile",
        sourceId: "11111111-1111-1111-1111-111111111111", // fake source
        ipApplicationId: "22222222-2222-2222-2222-222222222222", // fake app
        status: "submitted",
      })
    });
    console.log(res.status);
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}
test();
