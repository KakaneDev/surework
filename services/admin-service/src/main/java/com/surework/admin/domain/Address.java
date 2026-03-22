package com.surework.admin.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Embeddable address component for South African addresses.
 */
@Embeddable
public class Address {

    @Column(name = "address_line1")
    private String line1;

    @Column(name = "address_line2")
    private String line2;

    @Column(name = "city")
    private String city;

    @Column(name = "province")
    private String province;  // SA provinces

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "country")
    private String country = "South Africa";

    // South African Provinces
    public enum Province {
        EASTERN_CAPE("EC", "Eastern Cape"),
        FREE_STATE("FS", "Free State"),
        GAUTENG("GP", "Gauteng"),
        KWAZULU_NATAL("KZN", "KwaZulu-Natal"),
        LIMPOPO("LP", "Limpopo"),
        MPUMALANGA("MP", "Mpumalanga"),
        NORTHERN_CAPE("NC", "Northern Cape"),
        NORTH_WEST("NW", "North West"),
        WESTERN_CAPE("WC", "Western Cape");

        private final String code;
        private final String name;

        Province(String code, String name) {
            this.code = code;
            this.name = name;
        }

        public String getCode() { return code; }
        public String getName() { return name; }
    }

    // Constructors
    public Address() {}

    public Address(String line1, String line2, String city, String province, String postalCode, String country) {
        this.line1 = line1;
        this.line2 = line2;
        this.city = city;
        this.province = province;
        this.postalCode = postalCode;
        this.country = country;
    }

    // Business methods
    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (line1 != null) sb.append(line1);
        if (line2 != null) sb.append(", ").append(line2);
        if (city != null) sb.append(", ").append(city);
        if (province != null) sb.append(", ").append(province);
        if (postalCode != null) sb.append(", ").append(postalCode);
        if (country != null) sb.append(", ").append(country);
        return sb.toString();
    }

    // Getters and Setters
    public String getLine1() { return line1; }
    public void setLine1(String line1) { this.line1 = line1; }

    public String getLine2() { return line2; }
    public void setLine2(String line2) { this.line2 = line2; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}
