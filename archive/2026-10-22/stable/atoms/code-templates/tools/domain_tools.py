import os
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path

# ==========================================
# Domain Intelligence Tools
# ------------------------------------------
# A suite of atomic tools for Progressive Context Loading.
# ==========================================

DOCS_ROOT = Path("docs/domain")

def get_map():
    """Returns the Global Domain Model (The World View)."""
    path = DOCS_ROOT / "domain_model.xml"
    if not path.exists(): return "[Error: domain_model.xml not found]"
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def list_domains():
    """Returns a list of available domain directories."""
    domains = []
    if not DOCS_ROOT.exists(): return "[]"
    for item in DOCS_ROOT.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            domains.append(item.name)
    return "\n".join(domains)

def get_schema_lite(domain):
    """
    Design Phase Tool: Returns ONLY Table Names and Comments.
    Used when defining relationships, avoiding field-level noise.
    """
    path = DOCS_ROOT / domain / "schema.xml"
    if not path.exists(): return f"[Error: Schema for {domain} not found]"

    try:
        tree = ET.parse(path)
        root = tree.getroot()
        summary = []
        for table in root.findall(".//table"):
            name = table.get('name')
            comment = table.get('comment', 'No description')
            summary.append(f"- Table: {name} ({comment})")
        return "\n".join(summary)
    except Exception as e:
        return f"[Error parsing XML: {str(e)}]"

def get_schema_full(domain):
    """
    Coding Phase Tool: Returns the FULL Schema content.
    Used when writing Entity/DTO/SQL.
    """
    path = DOCS_ROOT / domain / "schema.xml"
    if not path.exists(): return f"[Error: Schema for {domain} not found]"
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command")

    # Command: map
    subparsers.add_parser("map", help="Get Global Domain Model")

    # Command: list
    subparsers.add_parser("list", help="List all Domains")

    # Command: lite
    lite_parser = subparsers.add_parser("lite", help="Get Schema Summary (Design Mode)")
    lite_parser.add_argument("domain", help="Domain name (e.g., service)")

    # Command: full
    full_parser = subparsers.add_parser("full", help="Get Full Schema (Dev Mode)")
    full_parser.add_argument("domain", help="Domain name (e.g., service)")

    args = parser.parse_args()

    if args.command == "map":
        print(get_map())
    elif args.command == "list":
        print(list_domains())
    elif args.command == "lite":
        print(get_schema_lite(args.domain))
    elif args.command == "full":
        print(get_schema_full(args.domain))
    else:
        parser.print_help()
