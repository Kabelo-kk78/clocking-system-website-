import "dotenv/config";
import {
  applicationDefault,
  cert,
  initializeApp,
  getApps,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const encoded = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!projectId) {
  console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  process.exit(1);
}

const existing = getApps()[0];
const app =
  existing ??
  initializeApp({
    credential: encoded
      ? cert(JSON.parse(Buffer.from(encoded, "base64").toString("utf8")))
      : applicationDefault(),
    projectId,
  });

const auth = getAuth(app);
const db = getFirestore(app);

const usersCol = db.collection("users");

async function upsertUser(
  email: string,
  password: string,
  profile: {
    fullName: string;
    role: "admin" | "employee";
    employeeNumber?: string;
    department?: string;
  }
) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: profile.fullName,
      emailVerified: true,
    });
    console.log(`Created auth user: ${email}`);
  }

  const uid = userRecord.uid;
  const existingDoc = await usersCol.doc(uid).get();
  if (!existingDoc.exists) {
    await usersCol.doc(uid).set({
      fullName: profile.fullName,
      email: email.toLowerCase(),
      role: profile.role,
      employeeNumber: profile.employeeNumber ?? null,
      department: profile.department ?? null,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`Created profile: ${email} (${profile.role})`);
  } else {
    console.log(`Profile already exists for ${email}, skipping.`);
  }
}

async function seed() {
  console.log("Connected to Firebase project:", projectId);

  await upsertUser("admin@mdihub.co.za", "Admin@123!", {
    fullName: "System Admin",
    role: "admin",
  });

  const demoEmployees = [
    { fullName: "Thabo Mokoena", email: "thabo@mdihub.co.za", employeeNumber: "MDI001", department: "Engineering" },
    { fullName: "Lerato Nkosi", email: "lerato@mdihub.co.za", employeeNumber: "MDI002", department: "Finance" },
    { fullName: "Sipho Dlamini", email: "sipho@mdihub.co.za", employeeNumber: "MDI003", department: "Operations" },
    { fullName: "Naledi Kekana", email: "naledi@mdihub.co.za", employeeNumber: "MDI004", department: "Marketing" },
    { fullName: "Kagiso Moloi", email: "kagiso@mdihub.co.za", employeeNumber: "MDI005", department: "HR" },
  ];

  for (const employee of demoEmployees) {
    await upsertUser(employee.email, "Pass@123!", {
      fullName: employee.fullName,
      role: "employee",
      employeeNumber: employee.employeeNumber,
      department: employee.department,
    });
  }

  console.log("Done.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
