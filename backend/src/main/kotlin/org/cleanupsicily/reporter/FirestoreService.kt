package org.cleanupsicily.reporter


import com.google.firebase.FirebaseApp
import com.google.firebase.cloud.FirestoreClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Service

@Service
class FirestoreService(firebaseApp: FirebaseApp) {

    private val firestore = FirestoreClient.getFirestore(firebaseApp)

    suspend fun getReports(): List<Map<String, Any>> {
        val snapshot = withContext(Dispatchers.IO) {
            firestore.collection("reports").get().get()
        }
        return snapshot.documents.map { it.data }
    }


    suspend fun saveReport(report: Map<String, Any>): String {
        return withContext(Dispatchers.IO) {
        val docRef = firestore.collection("reports").document()
        docRef.set(report).get()
        docRef.id
        }
    }
}
