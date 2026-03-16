#!/usr/bin/env ../../../venv/bin/python3
"""
Financial Data Crawler
Sử dụng vnstock để lấy báo cáo tài chính từ VCI
Cải tiến từ notebook với retry mechanism và error handling
"""

from vnstock import Vnstock
import pandas as pd
import time
import os
import sys
import json
from pathlib import Path

# Default symbols - Top companies in Vietnam stock market
DEFAULT_SYMBOLS = [
    "ACB","BCM","BID","BVH","CTG","FPT","GAS","GVR","HDB","HPG",
    "MBB","MSN","MWG","PLX","POW","SAB","SSI","STB","TCB","TPB",
    "VCB","VHM","VIB","VIC","VJC","VNM","VPB","VRE","VND","VIX",
    
    "DXG","DIG","NLG","KDH","PDR","NVL","HDG","CEO","SCR","HDC",
    "IDC","BCG","KBC","SZC","IJC","TIP","NTL","AGG","DRH","LDG",
    
    "DGC","DCM","DPM","CSV","LAS","BFC","PLC","PGD","PET","PVT",
    "PVS","PVD","BSR","OIL","GEX","GEE","PC1","TV2","REE","GEG",
    
    "NT2","PPC","HND","QTP","TTA","VSH","SJD","TMP","CHP",
    
    "CMG","DGW","FRT","CTR","ELC","VGI","FOX","SGT","VTP","SCS",
    
    "PNJ","DOJI","FMC","ANV","IDI","VHC","MPC","ACL","LTG","DBC",
    
    "HCM","VCI","BSI","SHS","CTS","FTS","AGR","MBS","BVS","TVS"
]

# Configuration
REQUEST_DELAY = 5  # seconds between requests
RETRY_DELAY = 60   # seconds to wait before retry
MAX_RETRY = 5      # maximum retry attempts


class FinancialDataCrawler:
    def __init__(self, symbols=None, period="quarter", output_dir=None, year=None, quarter=None):
        """
        Initialize crawler
        
        Args:
            symbols: List of stock symbols to crawl
            period: 'quarter' or 'year'
            output_dir: Directory to save output CSV
            year: Specific year to fetch
            quarter: Specific quarter to fetch
        """
        self.symbols = symbols or DEFAULT_SYMBOLS
        # Remove duplicates while preserving order
        self.symbols = list(dict.fromkeys(self.symbols))
        
        self.period = period
        self.year = year
        self.quarter = quarter
        self.vn = Vnstock()
        self.all_data = []
        
        # Setup output directory
        if output_dir is None:
            # Default: project_root/dataset
            script_dir = Path(__file__).resolve().parent
            project_root = script_dir.parent.parent
            self.output_dir = project_root / "dataset"
        else:
            self.output_dir = Path(output_dir)
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Statistics
        self.success_symbols = 0
        self.failed_symbols = []
        self.total_reports = 0
    
    def crawl_symbol(self, symbol):
        """
        Crawl financial reports for a single symbol
        
        Returns:
            bool: True if at least one report was successfully downloaded
        """
        print(f"\n🔄 Processing: {symbol}")
        
        # ===== Create stock object with retry =====
        stock = None
        retry = 0
        
        while True:
            try:
                stock = self.vn.stock(symbol=symbol, source="VCI")
                break
            
            except ValueError:
                print(f"❌ Invalid symbol -> skip {symbol}")
                return False
            
            except Exception as e:
                retry += 1
                print(f"⚠️ API error creating stock: {e}")
                
                if retry >= MAX_RETRY:
                    print("⛔ Skip symbol")
                    return False
                
                print(f"⏳ retry in {RETRY_DELAY}s")
                time.sleep(RETRY_DELAY)
        
        # ===== Download reports =====
        symbol_success = False
        
        for func, name in [
            (stock.finance.income_statement, "income_statement"),
            (stock.finance.balance_sheet, "balance_sheet"),
            (stock.finance.cash_flow, "cash_flow"),
        ]:
            retry = 0
            
            while True:
                try:
                    print(f"   → {name}", end="")
                    
                    # Build parameters for vnstock
                    params = {"period": self.period}
                    if self.year:
                        params["year"] = self.year
                    if self.quarter:
                        params["quarter"] = self.quarter
                    
                    print(f" (params: {params})", end="")
                    
                    df = func(**params)
                    
                    df["symbol"] = symbol
                    df["report"] = name
                    
                    self.all_data.append(df)
                    
                    print(" ✅")
                    
                    symbol_success = True
                    self.total_reports += 1
                    
                    time.sleep(REQUEST_DELAY)
                    break
                
                except Exception as e:
                    retry += 1
                    print(f"\n⚠️ error: {e}")
                    
                    if retry >= MAX_RETRY:
                        print("⛔ skip report")
                        break
                    
                    print(f"⏳ retry in {RETRY_DELAY}s")
                    time.sleep(RETRY_DELAY)
        
        return symbol_success
    
    def crawl_all(self):
        """
        Crawl all symbols
        """
        print("=" * 80)
        print("FINANCIAL DATA CRAWLER")
        print("=" * 80)
        print(f"Total symbols: {len(self.symbols)}")
        print(f"Period: {self.period}")
        print(f"Output: {self.output_dir}")
        print("=" * 80)
        
        start_time = time.time()
        
        for symbol in self.symbols:
            success = self.crawl_symbol(symbol)
            
            if success:
                self.success_symbols += 1
            else:
                self.failed_symbols.append(symbol)
        
        elapsed_time = time.time() - start_time
        
        # Print summary
        print("\n" + "=" * 80)
        print("CRAWL SUMMARY")
        print("=" * 80)
        print(f"✅ Success: {self.success_symbols}/{len(self.symbols)} symbols")
        print(f"📊 Total reports: {self.total_reports}")
        print(f"⏱️  Time elapsed: {elapsed_time:.1f}s")
        
        if self.failed_symbols:
            print(f"\n❌ Failed symbols ({len(self.failed_symbols)}):")
            for symbol in self.failed_symbols:
                print(f"   - {symbol}")
        
        print("=" * 80)
    
    def save_to_csv(self, filename="raw_financial_data.csv"):
        """
        Save crawled data to CSV
        """
        if not self.all_data:
            print("⚠️ No data to save")
            return None
        
        print(f"\n💾 Saving data...")
        
        final_df = pd.concat(self.all_data, ignore_index=True)
        
        output_path = self.output_dir / filename
        final_df.to_csv(
            output_path,
            index=False,
            encoding='utf-8-sig',
            float_format='%.0f'
        )
        
        print(f"✅ Saved to: {output_path}")
        print(f"   Total rows: {len(final_df)}")
        print(f"   Total columns: {len(final_df.columns)}")
        
        return str(output_path)
    
    def get_stats(self):
        """
        Get crawl statistics as dict
        """
        return {
            "total_symbols": len(self.symbols),
            "success_symbols": self.success_symbols,
            "failed_symbols": len(self.failed_symbols),
            "failed_list": self.failed_symbols,
            "total_reports": self.total_reports,
            "period": self.period
        }


def main():
    """
    CLI entry point
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Crawl financial data from VCI")
    parser.add_argument(
        "--symbols",
        nargs="+",
        help="List of symbols to crawl (default: top 100+ companies)"
    )
    parser.add_argument(
        "--period",
        choices=["quarter", "year"],
        default="quarter",
        help="Report period (default: quarter)"
    )
    parser.add_argument(
        "--output",
        help="Output directory (default: project_root/dataset)"
    )
    parser.add_argument(
        "--filename",
        default="raw_financial_data.csv",
        help="Output filename (default: raw_financial_data.csv)"
    )
    parser.add_argument(
        "--stats-json",
        help="Save statistics to JSON file"
    )
    parser.add_argument(
        "--year",
        type=int,
        help="Specific year to fetch (default: latest available)"
    )
    parser.add_argument(
        "--quarter",
        type=int,
        choices=[1, 2, 3, 4],
        help="Specific quarter to fetch (default: latest available)"
    )
    
    args = parser.parse_args()
    
    # Create crawler
    crawler = FinancialDataCrawler(
        symbols=args.symbols,
        period=args.period,
        output_dir=args.output,
        year=args.year,
        quarter=args.quarter
    )
    
    # Crawl
    crawler.crawl_all()
    
    # For single symbol: output JSON to stdout AND save files
    if len(crawler.symbols) == 1 and crawler.all_data:
        print("🐍 OUTPUTTING JSON DATA FOR SINGLE SYMBOL")
        
        # Combine all data for single symbol
        combined_data = {}
        for df in crawler.all_data:
            if not df.empty:
                row = df.iloc[0]  # Get first (and only) row
                for col, value in row.items():
                    if pd.notna(value):
                        combined_data[col] = str(value)
        
        # Save to CSV (for backup/debug)
        csv_filename = f"{crawler.symbols[0]}_Q{crawler.quarter}_{crawler.year}.csv"
        csv_path = crawler.save_to_csv(csv_filename)
        
        # Save to JSON (for backup/debug)
        import json
        json_filename = f"{crawler.symbols[0]}_Q{crawler.quarter}_{crawler.year}.json"
        json_path = crawler.output_dir / json_filename
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(combined_data, f, indent=2, ensure_ascii=False)
        print(f"✅ JSON saved to: {json_path}")
        
        # Output JSON to stdout (for Node.js to parse)
        print(json.dumps(combined_data, ensure_ascii=False, indent=2))
    
    # Save CSV for multiple symbols or if no data
    else:
        output_path = crawler.save_to_csv(args.filename)
        
        # Save stats if requested
        if args.stats_json:
            stats = crawler.get_stats()
            stats["output_file"] = output_path
            
            with open(args.stats_json, 'w', encoding='utf-8') as f:
                json.dump(stats, f, indent=2, ensure_ascii=False)
        
        print(f"\n📊 Stats saved to: {args.stats_json}")
    
    # Exit code
    if crawler.failed_symbols:
        sys.exit(1)  # Some failures
    else:
        sys.exit(0)  # All success


if __name__ == "__main__":
    main()
