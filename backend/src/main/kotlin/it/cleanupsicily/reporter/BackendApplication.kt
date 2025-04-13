package it.cleanupsicily.reporter

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
class BackendApplication

fun main(args: Array<String>) {
    runApplication<BackendApplication>(*args)
}

@RestController
class HelloWorldController {
    @GetMapping("hello-world")
    fun helloWorld(): String {
        return "Hello!"
    }
}