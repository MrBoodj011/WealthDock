import { describe, expect, it } from "vitest";
import { starterData } from "@/domain/demo-data";
import {
  exportTransactionsCsv,
  importTransactionsCsv,
  parseWealthDockJson,
} from "./import-export";

describe("portable data", () => {
  it("validates WealthDock JSON", () => {
    expect(parseWealthDockJson(JSON.stringify(starterData))).toEqual(
      starterData,
    );
    expect(() => parseWealthDockJson('{"accounts":[]}')).toThrow("schema");
  });

  it("imports valid CSV rows and reports invalid ones", () => {
    const csv = [
      "date,type,amount,account,targetAccount,category,note,tags",
      "2026-08-06,expense,25,Everyday,,Food,Lunch,work|meal",
      "2026-08-06,expense,-1,Everyday,,Food,Bad row,",
    ].join("\n");
    const result = importTransactionsCsv(csv, starterData.accounts);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].note).toBe("Lunch");
    expect(result.errors).toHaveLength(1);
  });

  it("neutralizes spreadsheet formulas in CSV exports", () => {
    const data = structuredClone(starterData);
    data.transactions[0].note = '=HYPERLINK("https://example.com")';
    expect(exportTransactionsCsv(data)).toContain("'=HYPERLINK");
  });
});
