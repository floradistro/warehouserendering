# Canva-Style Pipe Alignment System 📐

## Overview
Professional alignment indicators for pipe routing that work exactly like Canva's alignment guides. Shows subtle visual cues when pipes are level, plumb, or aligned with existing elements.

## Features Implemented ✅

### 🟢 **Horizontal Level Alignment**
**When**: Hover point is level (same height) as the last pipe point
**Visual**: **Bright green dashed line** extending horizontally
**Tolerance**: ±3" (quarter foot)
**Description**: "Level pipe run at X.X' height"

### 🟠 **Vertical Plumb Alignment**  
**When**: Hover point is directly above/below existing points
**Visual**: **Orange solid line** extending vertically
**Tolerance**: ±3" in X or Z direction
**Description**: "Plumb at X=XX.X'" or "Plumb at Z=XX.X'"

### 🟡 **Height Alignment with Snap Points**
**When**: Hover point aligns with snap points at same height
**Visual**: **Yellow dashed line** connecting aligned elements
**Tolerance**: ±3" height difference
**Description**: "Aligned with [snap point description] at X.X' height"

### 🔵 **Existing Pipe Alignment**
**When**: Hover point aligns with existing pipe heights
**Visual**: **Light blue dashed line** showing alignment
**Tolerance**: ±3" height, 2-25' horizontal distance
**Description**: "Level with existing pipe at X.X' height"

### 🟨 **Grid Alignment**
**When**: Hover point aligns with 1-foot grid
**Visual**: **Yellow cross-hairs** at grid intersections
**Tolerance**: ±3" from grid lines
**Description**: "Grid aligned at (XX', XX')"

## Visual Design 🎨

### **Canva-Style Indicators:**
- **Subtle appearance** - doesn't interfere with work
- **Color-coded** by alignment type
- **Confidence-based opacity** - stronger alignment = more visible
- **End point markers** - small spheres at guide line ends
- **Floating confidence indicator** - shows when alignment is strong

### **Line Styles:**
- **Solid lines** - Direct alignment between points
- **Dashed lines** - Extended alignment guides
- **Cross-hairs** - Grid alignment indicators
- **Thickness varies** - 1-3px based on importance

### **Colors:**
- 🟢 **Green** - Level/horizontal alignment (most important for plumbing)
- 🟠 **Orange** - Plumb/vertical alignment
- 🟡 **Yellow** - Height alignment with snap points
- 🔵 **Light Blue** - Alignment with existing pipes
- 🟨 **Yellow** - Grid alignment

## Professional Plumbing Applications 🚰

### **Level Pipe Runs:**
- **Irrigation manifolds** - ensure level distribution
- **Drain lines** - proper slope can be added after leveling
- **Supply headers** - level connection points
- **Equipment connections** - level mounting points

### **Plumb Connections:**
- **Vertical risers** - straight up/down connections
- **Drop connections** - straight down to fixtures
- **Stack alignments** - multiple floors aligned
- **Equipment mounting** - plumb installation

### **Height Consistency:**
- **Multiple fixtures** at same height
- **Parallel pipe runs** at consistent elevation
- **Equipment connections** at standard heights
- **Code compliance** with required heights

## Usage Instructions 🛠️

### **1. Start Creating Pipes**
- Switch to create mode in plumbing toolbar
- Click first point to establish starting position

### **2. Watch for Alignment Guides**
- Move mouse to second position
- **Green lines appear** when hover point is level with last point
- **Orange lines appear** when hover point is plumb (directly above/below)
- **Yellow lines appear** when aligned with snap points

### **3. Use the Guides**
- **Move mouse slowly** until you see alignment guides
- **Guide lines extend** beyond your points for clear visibility
- **Confidence indicator** appears when alignment is strong (>80%)
- **Click when aligned** - pipe will snap to exact alignment

### **4. Professional Results**
- **Level pipe runs** for proper flow
- **Plumb connections** for clean installation
- **Consistent heights** across multiple pipes
- **Grid-aligned layout** for organized routing

## Technical Implementation 🔧

### **Detection System:**
- **Real-time alignment detection** during mouse movement
- **Multiple alignment types** checked in priority order
- **Confidence scoring** based on how close to perfect alignment
- **Smart tolerance** - ±3" for professional tolerance

### **Visual Rendering:**
- **Dynamic guide lines** that appear/disappear smoothly
- **Multiple line styles** for different alignment types
- **Performance optimized** - only renders when needed
- **Non-intrusive** - subtle enough to not distract

### **Integration:**
- **Seamless integration** with existing pipe routing
- **Works with all materials** (PEX, copper, PVC)
- **Compatible with snap points** system
- **Respects existing pipe locations**

## Expected User Experience 📊

### **Console Output:**
```
📐 Alignment detected: Level pipe run at 2.5' height confidence: 0.95
📐 Alignment detected: Plumb at X=50.0' confidence: 0.88
📐 Alignment detected: Aligned with irrigation manifold connection at 1.5' height confidence: 0.92
```

### **Visual Feedback:**
- **Smooth guide lines** appear as you approach alignment
- **Color-coded indicators** show alignment type
- **Confidence sphere** appears when alignment is strong
- **Professional appearance** like CAD software

### **Professional Benefits:**
- **Faster pipe routing** - no manual measurement needed
- **Consistent installations** - all pipes properly aligned
- **Code compliance** - proper heights and spacing
- **Clean layouts** - organized, professional appearance

**Your pipe routing now has professional Canva-style alignment guides for perfect level and plumb installations! 📐✨**
