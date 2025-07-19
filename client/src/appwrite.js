import { Client, Databases, Query, ID } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;

// Debug environment variables
console.log("Appwrite Environment Variables:");
console.log("DATABASE_ID:", DATABASE_ID);
console.log("COLLECTION_ID:", COLLECTION_ID);
console.log("PROJECT_ID:", PROJECT_ID);

if (!DATABASE_ID || !COLLECTION_ID || !PROJECT_ID) {
  console.error("❌ Missing Appwrite environment variables!");
  console.error("DATABASE_ID:", !!DATABASE_ID);
  console.error("COLLECTION_ID:", !!COLLECTION_ID);
  console.error("PROJECT_ID:", !!PROJECT_ID);
}

const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject(PROJECT_ID);

const database = new Databases(client);


export const updateSearchCount = async (searchTerm, movie) => {
    try {
        const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID,[
            Query.equal("searchTerm", searchTerm),
        ]);
        if(response.documents.length > 0) {
            const documentId = response.documents[0].$id;
            await database.updateDocument(DATABASE_ID, COLLECTION_ID, documentId, {
                count: response.documents[0].count + 1
            });
        } else {
            await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                searchTerm: searchTerm,
                count: 1,
                movie_id: movie.id,
                poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            });
        }
    } catch (error) {
        console.error("API Error:", error);
    }
};

export const getTrendingMovies = async () => {
    try {
        const result = await database.listDocuments(DATABASE_ID,COLLECTION_ID,[
            Query.limit(4),
            Query.orderDesc("count"),
        ])
        return result.documents;
    } catch (error) {
        console.error("API Error:", error);
    }
}