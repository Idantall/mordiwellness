import { API_URL } from "@/firebase";
import axios from "axios";

type FirestoreData = Record<string, any>;

/**
 * Create a new document in a collection
 */
export async function createDocument(
    collection: string,
    data: FirestoreData,
    accessToken: string
) {
    const apiUrl = API_URL;
    const response = await axios.post(
        `${apiUrl}/api/firestore`,
        { collection, data },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
        }
    );

    if (response.status !== 200) {
        throw new Error("Failed to create document");
    }

    return response.data;
}

/**
 * Get a single document or all documents from a collection
 */
export async function getDocuments(
    accessToken: string,
    collection: string,
    id?: string
) {
    const apiUrl = API_URL;
    const url = new URL(`${apiUrl}/api/firestore`);
    url.searchParams.append("collection", collection);
    if (id) {
        url.searchParams.append("id", id);
    }

    try {
        const response = await axios.get(url.toString(), {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 200) {
            console.error(
                `Error fetching documents: ${response.status} - ${response.statusText}`
            );
            throw new Error("Failed to fetch documents");
        }

        return response.data;
    } catch (error) {
        console.error("Network error:", error);
        throw new Error("Failed to fetch documents");
    }
}

/**
 * Update an existing document
 */
export async function updateDocument(
    collection: string,
    id: string,
    data: FirestoreData,
    accessToken: string
) {
    const apiUrl = API_URL;
    const response = await axios.put(
        `${apiUrl}/api/firestore`,
        { collection, id, data },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
        }
    );

    if (response.status !== 200) {
        throw new Error("Failed to update document");
    }

    return response.data;
}

/**
 * Delete a document
 */
export async function deleteDocument(
    collection: string,
    id: string,
    accessToken: string
) {
    const apiUrl = API_URL;
    const url = new URL(`${apiUrl}/api/firestore`);
    url.searchParams.append("collection", collection);
    url.searchParams.append("id", id);

    const response = await axios.delete(url.toString(), {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
        withCredentials: true,
    });

    if (response.status !== 200) {
        throw new Error("Failed to delete document");
    }

    return response.data;
}

export const FireStoreConverter = (value: any): any => {
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(FireStoreConverter) } };
    } else if (typeof value === "number") {
        return Number.isInteger(value)
            ? { integerValue: value.toString() }
            : { doubleValue: value };
    } else if (typeof value === "boolean") {
        return { booleanValue: value };
    } else if (typeof value === "string") {
        return { stringValue: value };
    } else if (value === null) {
        return { nullValue: null };
    } else if (typeof value === "object") {
        if (value.latitude !== undefined && value.longitude !== undefined) {
            return { geoPointValue: { latitude: value.latitude, longitude: value.longitude } };
        }
        const fields: Record<string, any> = {};
        Object.keys(value).forEach((k) => {
            fields[k] = FireStoreConverter(value[k]);
        });
        return { mapValue: { fields } };
    }
    return value;
};

const getFireStoreProp = (value: any) => {
    const props = {
        arrayValue: 1,
        bytesValue: 1,
        booleanValue: 1,
        doubleValue: 1,
        geoPointValue: 1,
        integerValue: 1,
        mapValue: 1,
        nullValue: 1,
        referenceValue: 1,
        stringValue: 1,
        timestampValue: 1,
    };
    return Object.keys(value).find((k) => props[k as keyof typeof props] === 1);
};

export const FireStoreParser = (value: any) => {
    const prop = getFireStoreProp(value);
    if (prop === "doubleValue" || prop === "integerValue") {
        value = Number(value[prop]);
    } else if (prop === "arrayValue") {
        value = ((value[prop] && value[prop].values) || []).map((v: any) =>
            FireStoreParser(v)
        );
    } else if (prop === "mapValue") {
        value = FireStoreParser((value[prop] && value[prop].fields) || {});
    } else if (prop === "geoPointValue") {
        value = { latitude: 0, longitude: 0, ...value[prop] };
    } else if (prop) {
        value = value[prop];
    } else if (typeof value === "object") {
        Object.keys(value).forEach(
            (k) => (value[k] = FireStoreParser(value[k]))
        );
    }
    return value;
};
