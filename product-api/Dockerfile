FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY product-api/pom.xml .
COPY product-api/.mvn .mvn
COPY product-api/mvnw .
COPY product-api/src src
COPY product-api/seed-data seed-data
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/api-0.0.1-SNAPSHOT.jar app.jar
COPY --from=build /app/seed-data seed-data
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
