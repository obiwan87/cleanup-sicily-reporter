# Fase di build
FROM amazoncorretto:21-alpine AS build

WORKDIR /app
COPY . .

RUN ./gradlew bootJar

# Fase di runtime
FROM amazoncorretto:23-alpine

WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
