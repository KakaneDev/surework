package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Represents a line item on an invoice.
 * Handles quantity, pricing, discounts, and VAT calculation.
 */
@Entity
@Table(name = "invoice_lines", indexes = {
        @Index(name = "idx_invoice_lines_invoice", columnList = "invoice_id")
})
@Getter
@Setter
@NoArgsConstructor
public class InvoiceLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    // Product/Service reference (optional)
    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(name = "product_name", length = 200)
    private String productName;

    // Quantity and pricing
    @Column(name = "quantity", nullable = false, precision = 15, scale = 4)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit_of_measure", length = 20)
    private String unitOfMeasure;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 4)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    // Discount
    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    // VAT
    @Enumerated(EnumType.STRING)
    @Column(name = "vat_category", nullable = false, length = 20)
    private VatCategory vatCategory = VatCategory.STANDARD;

    @Column(name = "vat_rate", precision = 5, scale = 4)
    private BigDecimal vatRate = new BigDecimal("0.15");

    @Column(name = "vat_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    // Totals
    @Column(name = "line_subtotal", nullable = false, precision = 15, scale = 2)
    private BigDecimal lineSubtotal = BigDecimal.ZERO;

    @Column(name = "line_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal lineTotal = BigDecimal.ZERO;

    // Account mapping
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revenue_account_id")
    private Account revenueAccount;

    /**
     * VAT categories for line items.
     */
    public enum VatCategory {
        STANDARD,       // Standard rate (15%)
        ZERO_RATED,     // Zero-rated (exports, basic food)
        EXEMPT,         // VAT exempt
        OUT_OF_SCOPE    // Outside VAT scope
    }

    /**
     * Create a new invoice line.
     */
    public static InvoiceLine create(
            String description,
            BigDecimal quantity,
            BigDecimal unitPrice,
            VatCategory vatCategory) {

        InvoiceLine line = new InvoiceLine();
        line.setDescription(description);
        line.setQuantity(quantity);
        line.setUnitPrice(unitPrice);
        line.setVatCategory(vatCategory);
        line.setVatRate(getVatRateForCategory(vatCategory));
        line.calculateTotals();
        return line;
    }

    /**
     * Create a line for a product/service.
     */
    public static InvoiceLine forProduct(
            UUID productId,
            String productCode,
            String productName,
            String description,
            BigDecimal quantity,
            BigDecimal unitPrice,
            VatCategory vatCategory) {

        InvoiceLine line = create(description, quantity, unitPrice, vatCategory);
        line.setProductId(productId);
        line.setProductCode(productCode);
        line.setProductName(productName);
        return line;
    }

    /**
     * Get VAT rate for a category.
     */
    public static BigDecimal getVatRateForCategory(VatCategory category) {
        return switch (category) {
            case STANDARD -> new BigDecimal("0.15");
            case ZERO_RATED, EXEMPT, OUT_OF_SCOPE -> BigDecimal.ZERO;
        };
    }

    /**
     * Calculate all totals for this line.
     */
    public void calculateTotals() {
        // Gross amount before discount
        BigDecimal grossAmount = quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

        // Calculate discount
        if (discountPercentage != null && discountPercentage.compareTo(BigDecimal.ZERO) > 0) {
            this.discountAmount = grossAmount.multiply(discountPercentage)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        } else if (discountAmount == null) {
            this.discountAmount = BigDecimal.ZERO;
        }

        // Subtotal after discount (before VAT)
        this.lineSubtotal = grossAmount.subtract(discountAmount);

        // Calculate VAT
        if (vatCategory == VatCategory.STANDARD) {
            this.vatAmount = lineSubtotal.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);
        } else {
            this.vatAmount = BigDecimal.ZERO;
        }

        // Total including VAT
        this.lineTotal = lineSubtotal.add(vatAmount);
    }

    /**
     * Apply a percentage discount.
     */
    public void applyDiscountPercentage(BigDecimal percentage) {
        this.discountPercentage = percentage;
        this.discountAmount = null; // Will be calculated
        calculateTotals();
    }

    /**
     * Apply a fixed discount amount.
     */
    public void applyDiscountAmount(BigDecimal amount) {
        this.discountAmount = amount;
        this.discountPercentage = BigDecimal.ZERO;
        calculateTotals();
    }

    /**
     * Update quantity and recalculate.
     */
    public void updateQuantity(BigDecimal newQuantity) {
        this.quantity = newQuantity;
        calculateTotals();
    }

    /**
     * Update unit price and recalculate.
     */
    public void updateUnitPrice(BigDecimal newUnitPrice) {
        this.unitPrice = newUnitPrice;
        calculateTotals();
    }

    /**
     * Change VAT category and recalculate.
     */
    public void changeVatCategory(VatCategory newCategory) {
        this.vatCategory = newCategory;
        this.vatRate = getVatRateForCategory(newCategory);
        calculateTotals();
    }

    /**
     * Get gross amount (before discount).
     */
    public BigDecimal getGrossAmount() {
        return quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Get effective VAT rate as percentage.
     */
    public BigDecimal getEffectiveVatPercentage() {
        return vatRate.multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Check if this line has VAT.
     */
    public boolean hasVat() {
        return vatCategory == VatCategory.STANDARD;
    }
}
