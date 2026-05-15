package com.hust.roomrental;

import java.time.ZoneId;
import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RoomRentalApplication {
    public static void main(String[] args) {
        // JDBC sends the JVM default zone at connect; some PostgreSQL builds reject legacy "Asia/Saigon".
        TimeZone.setDefault(TimeZone.getTimeZone(ZoneId.of("Asia/Ho_Chi_Minh")));
        SpringApplication.run(RoomRentalApplication.class, args);
    }
}
