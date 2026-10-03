# Build stage using official Maven with Java 21
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml ./
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Run stage with slim JRE 21
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the built jar file
COPY --from=builder /app/target/task_management_system-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Run Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
