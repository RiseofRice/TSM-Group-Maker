# TSM Group Maker

A simple web tool to convert Wowhead item lists into TradeSkillMaster (TSM) import format.

## 🎮 What is this?

TSM Group Maker helps World of Warcraft players quickly convert item IDs from Wowhead into the format required by the TradeSkillMaster addon. Simply paste your Wowhead URLs or item IDs, and get a TSM-ready string you can import directly into the game.

## 🚀 How to Use

1. **Open the website**: Open `index.html` in your web browser
2. **Paste your items**: Input any of the following formats:
   - Wowhead URLs: `https://www.wowhead.com/item=12345`
   - Plain item IDs: `12345, 67890, 13579`
   - Item format: `item:12345`
   - Mix and match any format!
3. **Convert**: Click the "Convert to TSM Format" button
4. **Copy**: Click "Copy to Clipboard" 
5. **Import in TSM**: Open TSM in-game, go to Groups → Import, and paste the string

## 📋 Supported Input Formats

- **Wowhead URLs**: `https://www.wowhead.com/item=12345/item-name`
- **Wowhead URLs (classic)**: `https://classic.wowhead.com/item=12345`
- **Plain numbers**: `12345, 67890, 13579` (comma or space separated)
- **Item format**: `item:12345`
- **TSM format**: `i:12345` (will be included as-is)
- **Item names**: `[Thunderfury, Blessed Blade of the Windseeker]` (searches Wowhead for the item ID)

## 📦 Output Format

The tool generates output in TSM's required format:
```
i:12345,i:67890,i:13579
```

This can be imported directly into TradeSkillMaster's group import feature (up to 1000 items at once).

## 🛠️ Features

- ✅ Extracts item IDs from multiple formats
- ✅ Searches Wowhead by item name (using square brackets)
- ✅ Removes duplicates automatically
- ✅ Counts total and unique items
- ✅ One-click copy to clipboard
- ✅ Clean, responsive design
- ✅ Works offline (except for item name search)

## 💻 Installation

No installation needed! Just download or clone this repository and open `index.html` in any modern web browser.

```bash
git clone https://github.com/RiseofRice/TSM-Group-Maker.git
cd TSM-Group-Maker
# Open index.html in your browser
```

## 📝 Example

**Input:**
```
https://www.wowhead.com/item=19019/thunderfury-blessed-blade-of-the-windseeker
https://www.wowhead.com/item=17182/sulfuras-hand-of-ragnaros
18803, 18832
item:17076
[Ashkandi, Greatsword of the Brotherhood]
```

**Output:**
```
i:17076,i:17182,i:18803,i:18832,i:19019,i:19364
```

Note: When using item names in square brackets, the tool will search Wowhead to find the item ID automatically.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License - see LICENSE file for details