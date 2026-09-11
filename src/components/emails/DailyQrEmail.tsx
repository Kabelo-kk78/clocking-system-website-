import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface DailyQrEmailProps {
  fullName: string;
  date: string;
  employeeNumber?: string;
  qrDataUrl: string;
  checkInUrl: string;
  geofenceName?: string;
}

export default function DailyQrEmail({
  fullName,
  date,
  employeeNumber,
  qrDataUrl,
  checkInUrl,
  geofenceName = "the workplace",
}: DailyQrEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your daily QR code for {date} — clock in at {geofenceName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Daily QR Code for Clocking In</Heading>

          <Text style={paragraph}>
            Hi {fullName},{employeeNumber ? ` (${employeeNumber})` : ""}
          </Text>
          <Text style={paragraph}>
            Scan the QR code below on {date} to clock in. You must be within {geofenceName} to
            check in successfully.
          </Text>

          <Section style={qrSection}>
            <Img src={qrDataUrl} width="260" height="260" alt="Daily QR code" />
          </Section>

          <Text style={paragraph}>Or tap the button below to open the check-in page:</Text>
          <Section style={buttonSection}>
            <Button href={checkInUrl} style={button}>
              Open Check-in Page
            </Button>
          </Section>

          <Text style={muted}>
            This QR code is unique to you and valid only for {date}. If you did not request this
            email, please contact your administrator.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 20px 32px",
  maxWidth: "560px",
};

const heading = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "24px 0 8px",
};

const paragraph = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "24px",
};

const qrSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#FFC107",
  color: "#1a1a1a",
  fontSize: "15px",
  fontWeight: "bold",
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "8px",
};

const muted = {
  color: "#666",
  fontSize: "13px",
  lineHeight: "20px",
  marginTop: "24px",
};