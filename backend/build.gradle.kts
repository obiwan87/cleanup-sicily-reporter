plugins {
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
    id("org.springframework.boot") version "3.4.4"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "it.cleanupsicily"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.9.0")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("com.google.firebase:firebase-admin:9.4.3")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}


val frontendDir = "${projectDir}/../frontend"
val npmExecutable = if (System.getProperty("os.name").startsWith("Windows")) {
    "npm.cmd"
} else {
    "npm"
}
tasks.register<Exec>("npmInstall") {
    workingDir = file(frontendDir)
    commandLine(npmExecutable, "install")
}

tasks.register<Exec>("npmBuild") {
    dependsOn("npmInstall")
    workingDir = file(frontendDir)
    commandLine(npmExecutable, "run", "build")
}

tasks.named("processResources") {
    dependsOn("npmBuild")
}

tasks.register("printPath") {
    doLast {
        println("PATH = " + System.getenv("PATH"))
    }
}