package com.surework.notification.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.util.Map;

/**
 * Service for generating BCEA-compliant employment contract PDFs.
 * Selects the appropriate contract template based on employment type.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ContractPdfService {

    private final ITemplateEngine templateEngine;

    /**
     * Generate an employment contract PDF.
     *
     * @param contractData map containing all contract variables (candidateName, jobTitle, salary, etc.)
     * @return PDF as byte array
     */
    public byte[] generateEmploymentContract(Map<String, Object> contractData) {
        String employmentType = (String) contractData.getOrDefault("employmentType", "FULL_TIME");
        String templateName = resolveTemplateName(employmentType);

        log.debug("Generating {} contract for {}", employmentType, contractData.get("candidateName"));

        try {
            Context context = new Context();
            context.setVariables(contractData);
            String html = templateEngine.process(templateName, context);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);
            builder.run();

            byte[] pdf = outputStream.toByteArray();
            log.info("Generated {} contract PDF ({} bytes) for {}",
                    employmentType, pdf.length, contractData.get("candidateName"));
            return pdf;
        } catch (Exception e) {
            log.error("Failed to generate employment contract PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate employment contract PDF", e);
        }
    }

    String resolveTemplateName(String employmentType) {
        return switch (employmentType) {
            case "CONTRACT", "FREELANCE" -> "contract/fixed-term";
            case "TEMPORARY" -> "contract/temporary";
            case "INTERNSHIP" -> "contract/internship";
            default -> "contract/permanent"; // FULL_TIME, PART_TIME
        };
    }
}
