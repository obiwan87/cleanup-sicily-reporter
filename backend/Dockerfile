# Fase di build
FROM amazoncorretto:21 AS build

# Install Node.js + npm
RUN yum install -y curl && \
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && \
    yum install -y nodejs \

WORKDIR /app
COPY . .

RUN chmod +x gradlew && ./gradlew bootJar

# Fase di runtime
FROM amazoncorretto:21

WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
