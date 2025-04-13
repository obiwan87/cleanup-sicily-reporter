# Fase di build
FROM amazoncorretto:21 AS build

WORKDIR /app
COPY . .

RUN chmod +x gradlew && ./gradlew bootJar

# Fase di runtime
FROM amazoncorretto:21

WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
