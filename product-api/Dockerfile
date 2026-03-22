FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY product-api/pom.xml .
COPY product-api/.mvn .mvn
COPY product-api/mvnw .
COPY product-api/src src
COPY product-api/seed-data seed-data
COPY product-api/certs certs
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY --from=build /app/target/api-0.0.1-SNAPSHOT.jar app.jar
COPY --from=build /app/seed-data seed-data
COPY --from=build /app/certs /app/certs
RUN keytool -importcert -noprompt -storepass changeit \
    -alias russian-trusted-root-ca \
    -file /app/certs/russian-trusted-root-ca.pem \
    -keystore "$JAVA_HOME/lib/security/cacerts"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
