import "dotenv/config";
import axios from "axios";

class MpesaService {
  constructor() {
    // Daraja credentials come from the environment (.env); see .env.example.
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.businessShortCode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;

    this.baseUrl =
      process.env.MPESA_ENV === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Generate access token
  async generateAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(
        `${this.consumerKey}:${this.consumerSecret}`
      ).toString("base64");

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        { headers: { Authorization: `Basic ${auth}` } }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry =
        Date.now() + response.data.expires_in * 1000 - 60000;

      return this.accessToken;
    } catch (error) {
      console.error(
        " Error generating access token:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Generate Safaricom timestamp (YYYYMMDDHHMMSS)
  generateTimestamp() {
    const now = new Date();
    return (
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0")
    );
  }

  // Generate password for STK push
  generatePassword() {
    const timestamp = this.generateTimestamp();
    const password = Buffer.from(
      `${this.businessShortCode}${this.passkey}${timestamp}`
    ).toString("base64");

    return { password, timestamp };
  }

  // Initiate STK push
  async stkPush({ phoneNumber, amount, reference, description }) {
    try {
      const accessToken = await this.generateAccessToken();
      const { password, timestamp } = this.generatePassword();

      const payload = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.max(1, Math.round(amount)), 
        PartyA: phoneNumber,
        PartyB: this.businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: reference?.slice(0, 12) || "Booking",
        TransactionDesc: description || "Event Ticket",
      };

      console.log(" STK Push Payload:", payload);

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(" STK Push Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        " STK Push Error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Query STK push status
  async stkQuery(checkoutRequestId) {
    try {
      const accessToken = await this.generateAccessToken();
      const { password, timestamp } = this.generatePassword();

      const payload = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      console.log("STK Query Payload:", payload);

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(" STK Query Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "STK Query Error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

export default new MpesaService();
