"use client";

import { deleteDoc, doc, DocumentReference, getDoc, setDoc } from "firebase/firestore";
import { Message } from "@/types";
import { db } from "./client";
import { v4 as uuid } from "uuid";

export default async function sendSMSMessage(
  message: Message
): Promise<DocumentReference> {
  const messageDocRef = doc(db, "messages", uuid());
  const messageSnapshot = await getDoc(messageDocRef);

  if (!messageSnapshot.exists()) {
    const { label, ...messageData } = message;
    await setDoc(messageDocRef, { ...messageData });
  }

  return messageDocRef;
}

export async function createInitialMessage(message: any) {
  const messageId = uuid();
  const messageDocRef = doc(db, "initial-messages", messageId);
  const messageSnapshot = await getDoc(messageDocRef);

  if (!messageSnapshot.exists()) {
    await setDoc(messageDocRef, { ...message, id: messageId });
  }

  return messageDocRef;
}

export async function updateInitialMessage(messageId: string, updatedMessage: any) {
  const messageDocRef = doc(db, "initial-messages", messageId);
  const messageSnapshot = await getDoc(messageDocRef);

  if (messageSnapshot.exists()) {
    await setDoc(messageDocRef, { ...updatedMessage, id: messageId });
  } else {
    throw new Error("Message not found");
  }

  return messageDocRef;
}

export async function deleteInitialMessage(messageId: string) {
  const messageDocRef = doc(db, "initial-messages", messageId);
  const messageSnapshot = await getDoc(messageDocRef);

  if (messageSnapshot.exists()) {
    await deleteDoc(messageDocRef);
  } else {
    throw new Error("Message not found");
  }

  return messageDocRef;
}
