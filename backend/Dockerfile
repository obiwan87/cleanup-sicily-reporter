FROM amazoncorretto:21

WORKDIR /app

# Copia direttamente il jar generato dal CI
COPY build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]