package org.cleanupsicily.reporter

import com.google.firebase.cloud.FirestoreClient
import com.google.cloud.firestore.Firestore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class ReportSubmissionService {

    private val firestore: Firestore = FirestoreClient.getFirestore()

    suspend fun submitReport(data: Map<String, Any?>): String {
        val docRef = firestore.collection("reports").document()

        val toSave = data.toMutableMap()
        toSave["created_at"] = Instant.now().toString()

        withContext(Dispatchers.IO) {
            docRef.set(toSave).get()
        }

        return docRef.id
    }
}
