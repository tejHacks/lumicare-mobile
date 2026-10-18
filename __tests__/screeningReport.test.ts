import { getScreeningById } from "../src/db/database";
import { getScreeningImageDataUri } from "../src/db/screeningImages";
import { exportScreeningPdf } from "../src/services/pdf/screeningReport";

jest.mock("../src/db/database", () => ({
  getScreeningById: jest.fn(),
  getAllScreenings: jest.fn(),
}));
jest.mock("../src/db/screeningImages", () => ({
  getScreeningImageDataUri: jest.fn(),
}));
jest.mock("expo-print", () => ({
  printAsync: jest.fn(),
  printToFileAsync: jest.fn().mockResolvedValue({ uri: "file:///cache/report.pdf" }),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

const savedScreening = {
  id: 42,
  babyName: "Noah & Ada",
  date: "2026-10-15T08:00:00.000Z",
  riskScore: "possible",
  imagePath: "file:///documents/screenings/42.jpg",
  notes: "Follow up",
  dateOfBirth: "2026-10-01",
  demo: false,
  legacyId: null,
};

describe("screening report PDF export", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads the selected SQLite row and local image path before sharing the PDF", async () => {
    jest.mocked(getScreeningById).mockResolvedValue(savedScreening);
    jest.mocked(getScreeningImageDataUri).mockResolvedValue("data:image/jpeg;base64,encoded-image");

    await exportScreeningPdf(42);

    expect(getScreeningById).toHaveBeenCalledWith(42);
    expect(getScreeningImageDataUri).toHaveBeenCalledWith(savedScreening.imagePath);
    const printOptions = jest.mocked(require("expo-print").printToFileAsync).mock.calls[0][0];
    expect(printOptions.html).toContain("Noah &amp; Ada");
    expect(printOptions.html).toContain("data:image/jpeg;base64,encoded-image");
    expect(require("expo-sharing").shareAsync).toHaveBeenCalledWith(
      "file:///cache/report.pdf",
      expect.objectContaining({ mimeType: "application/pdf" }),
    );
  });

  it("rejects an unknown record rather than generating an empty report", async () => {
    jest.mocked(getScreeningById).mockResolvedValue(null);

    await expect(exportScreeningPdf(999)).rejects.toThrow("could not be found");
    expect(jest.mocked(getScreeningImageDataUri)).not.toHaveBeenCalled();
  });
});