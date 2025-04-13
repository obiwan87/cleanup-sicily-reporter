package it.cleanupsicily.reporter.config

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.FileInputStream

@Configuration
class FirebaseConfig {

    @Bean
    fun firebaseApp(): FirebaseApp {
        val credentialsPath = System.getenv("FIREBASE_CREDENTIALS")
            ?: throw IllegalStateException("FIREBASE_CREDENTIALS not set")

        val options = FirebaseOptions.builder()
            .setCredentials(GoogleCredentials.fromStream(FileInputStream(credentialsPath)))
            .build()

        return FirebaseApp.initializeApp(options)
    }
}
