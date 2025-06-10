import { NextResponse, NextRequest } from "next/server";
import axios from "axios";

const FIREBASE_STORAGE_URL = `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o`;

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!accessToken) {
            return NextResponse.json(
                { error: "Access token is missing" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get("path");

        if (!filePath) {
            return NextResponse.json(
                { error: "File path is required" },
                { status: 400 }
            );
        }

        const response = await axios.get(
            `${FIREBASE_STORAGE_URL}/${encodeURIComponent(filePath)}?alt=media`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const contents = response.data;

        if (filePath.endsWith(".json")) {
            return NextResponse.json(contents);
        }

        return new NextResponse(contents);
    } catch (error) {
        console.error("Error fetching file:", error);
        return NextResponse.json(
            { error: "Failed to fetch file" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!accessToken) {
            return NextResponse.json(
                { error: "Access token is missing" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const path = formData.get("path") as string;

        if (!file || !path) {
            return NextResponse.json(
                { error: "File and path are required" },
                { status: 400 }
            );
        }

        const buffer = await file.arrayBuffer();
        const content = new Uint8Array(buffer);

        await axios.post(
            `${FIREBASE_STORAGE_URL}/${encodeURIComponent(path)}`,
            content,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/octet-stream",
                },
            }
        );

        const fileUrl = `${FIREBASE_STORAGE_URL}/${encodeURIComponent(path)}?alt=media`;

        return NextResponse.json({
            message: "File created/updated successfully",
            url: fileUrl,
        });
    } catch (error) {
        console.error("Error creating/updating file:", error);
        return NextResponse.json(
            { error: "Failed to create/update file" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!accessToken) {
            return NextResponse.json(
                { error: "Access token is missing" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get("path");

        if (!filePath) {
            return NextResponse.json(
                { error: "File path is required" },
                { status: 400 }
            );
        }

        await axios.delete(
            `${FIREBASE_STORAGE_URL}/${encodeURIComponent(filePath)}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return NextResponse.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!accessToken) {
            return NextResponse.json(
                { error: "Access token is missing" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get("path");

        if (!filePath) {
            return NextResponse.json(
                { error: "File path is required" },
                { status: 400 }
            );
        }

        const content = await request.text();

        await axios.put(
            `${FIREBASE_STORAGE_URL}/${encodeURIComponent(filePath)}`,
            content,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return NextResponse.json({
            message: "File updated successfully",
        });
    } catch (error) {
        console.error("Error updating file:", error);
        return NextResponse.json(
            { error: "Failed to update file" },
            { status: 500 }
        );
    }
}
