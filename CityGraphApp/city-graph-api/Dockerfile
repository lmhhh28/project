FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml ./
COPY src ./src

RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S citygraph && adduser -S citygraph -G citygraph

COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8080

USER citygraph

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
