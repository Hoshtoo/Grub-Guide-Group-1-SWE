import { useState, useEffect, useMemo } from "react"
import { supabase } from "./supabaseClient"
import AddItemForm from "./components/AddItemForm"
import SearchBar from "./components/SearchBar"
import FilterBar from "./components/FilterBar"
import InventoryList from "./components/InventoryList"
import BakingTracker from "./components/BakingTracker"
import BarcodeScanner from "./components/BarcodeScanner"

function App() {
    const [items, setItems] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("")
    const [locationFilter, setLocationFilter] = useState("")
    const [editingItem, setEditingItem] = useState(null)
    const [isScanning, setIsScanning] = useState(false);
    const [showShoppingList, setShowShoppingList] = useState(false);
    
    const [timeTick, setTimeTick] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeTick(Date.now());
        }, 30000); 
        return () => clearInterval(timer);
    }, []);
    // ----------------------------

    useEffect(() => {
        fetchItems()

        const channel = supabase
            .channel("realtime-inventory")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "inventory_items"
                },
                () => {
                    fetchItems()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function fetchItems() {
        const { data, error } = await supabase
            .from("inventory_items")
            .select("*")
            .order("created_at", { ascending: false });

        if (error || !data || data.length === 0) {
            console.warn("Database unavailable or empty, loading from local storage...");
            const localData = JSON.parse(localStorage.getItem("grub_guide_backup") || "[]");
            setItems(localData);
        } else {
            setItems(data);
        }
    }

    const duplicateItemIds = useMemo(() => {
        const duplicates = new Set();
        const grouped = {};

        items.forEach(item => {
            const name = item.item_name?.toLowerCase().trim();
            if (!name) return;
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(item);
        });

        Object.values(grouped).forEach(group => {
            if (group.length > 1) {
                group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                for (let i = 0; i < group.length; i++) {
                    for (let j = i + 1; j < group.length; j++) {
                        const timeI = new Date(group[i].created_at).getTime();
                        const timeJ = new Date(group[j].created_at).getTime();
                        if (Math.abs(timeI - timeJ) < 600000) {
                            duplicates.add(group[i].id);
                            duplicates.add(group[j].id);
                        }
                    }
                }
            }
        });
        return duplicates;
    }, [items]);
    // ------------------------------------------

    async function handleAddItem(newItem) {
        const itemWithMeta = { 
            ...newItem, 
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(), 
            times_used: 0 
        };

        const newItemsList = [itemWithMeta, ...items];
        setItems(newItemsList);
        localStorage.setItem("grub_guide_backup", JSON.stringify(newItemsList));

        await supabase.from("inventory_items").insert([itemWithMeta]);
    }

    async function handleUpdateItem(id, updatedFields) {
        const { error } = await supabase
            .from("inventory_items")
            .update(updatedFields)
            .eq("id", id)

        if (error) {
            console.error("Error updating item:", error)
        }
        setEditingItem(null)
    }

    function handleReceiptUpload() {
        alert("Simulating Receipt Scan... (Processing Image)");
        setTimeout(() => {
            handleAddItem({
                item_name: "Kroger Large Eggs (12ct)",
                category: "Dairy",
                location: "Fridge",
                shelf_life: 21,
                brand_name: "Kroger"
            });
            alert("Receipt Processed! Found: Kroger Large Eggs");
        }, 1500);
    }

    const rarelyUsedItems = items.filter(item => {
        if (!item.last_used_at) return false;
        const lastUsed = new Date(item.last_used_at);
        const today = new Date();
        const daysSinceUse = (today - lastUsed) / (1000 * 60 * 60 * 24);
        return daysSinceUse > 14; 
    });

    async function handleDelete(id) {
        const updatedItems = items.filter(item => item.id !== id);
        setItems(updatedItems);
        localStorage.setItem("grub_guide_backup", JSON.stringify(updatedItems));
        const { error } = await supabase
            .from("inventory_items")
            .delete()
            .eq("id", id);

        if (error) {
            console.warn("Database sync failed, but item removed locally for demo.");
        }
    }

    async function handleBarcodeScan(decodedText) {
        if (!isScanning) return; 
        setIsScanning(false); 
        console.log("Processing Scan:", decodedText);
        const cleanCode = decodedText.trim();

        try {
            const { data: sbData, error: sbError } = await supabase
                .from('inventory_master')
                .select('*')
                .like('gtin_upc', `%${cleanCode}`) 
                .maybeSingle();

            if (sbError) console.error("Supabase Search Error:", sbError);

            if (sbData) {
                handleAddItem({
                    item_name: sbData.brand_name || "Unknown Product",
                    brand_name: sbData.brand_name || "Generic",
                    category: sbData.branded_food_category || "Pantry",
                    shelf_life: sbData.Shelf_Life || 14, 
                    location: "Pantry" 
                });
                alert(`Found in Pantry Database: ${sbData.brand_name}`);
                return; 
            }

            const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`);
            const offData = await offResponse.json();

            if (offData.status === 1) {
                const p = offData.product;
                const fullName = p.brands ? `${p.brands} ${p.product_name}` : p.product_name;
                handleAddItem({
                    item_name: fullName || "New Product",
                    brand_name: p.brands || "Generic",
                    category: p.categories?.split(',')[0] || "Pantry",
                    shelf_life: 14, 
                    location: "Pantry"
                });
                alert(`Found in Global Registry: ${fullName}`);
                return;
            }
            alert(`Product ${cleanCode} not found. Please enter details manually.`);
        } catch (err) {
            console.error("Critical Scanner Error:", err);
        }
    }

    const filteredItems = useMemo(() => {
        let result = items || [] 
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter((item) =>
                item.item_name?.toLowerCase().includes(q)
            )
        }
        if (categoryFilter) {
            result = result.filter((item) => item.category === categoryFilter)
        }
        if (locationFilter) {
            result = result.filter((item) => item.location === locationFilter)
        }
        return result
    }, [items, searchQuery, categoryFilter, locationFilter])

    return (
        <div style={styles.page}>
            <header style={styles.headerSection}>
                <h1 style={styles.header}>GrubGuide</h1>
                <p style={styles.subtitle}>Shared Household Inventory</p>
            </header>

            <div style={{ maxWidth: "600px", margin: "0 auto 20px", display: "flex", gap: "10px" }}>
                <button 
                    onClick={() => setIsScanning(!isScanning)}
                    style={{ 
                        flex: 1, 
                        padding: '14px', 
                        backgroundColor: isScanning ? '#bc4749' : '#2d6a4f', 
                        color: 'white', 
                        borderRadius: '8px', 
                        border: 'none', 
                        fontWeight: '600', 
                        cursor: 'pointer' 
                    }}
                >
                    {isScanning ? "✕ Close Scanner" : "📷 Scan Barcode"}
                </button>

                <button 
                    onClick={handleReceiptUpload}
                    style={{ 
                        flex: 1, 
                        padding: '14px', 
                        backgroundColor: '#457b9d', 
                        color: 'white', 
                        borderRadius: '8px', 
                        border: 'none', 
                        fontWeight: '600', 
                        cursor: 'pointer' 
                    }}
                >
                    🧾 Upload Receipt
                </button>
            </div>

            {isScanning && (
                <div style={{ maxWidth: "600px", margin: "0 auto 15px", borderRadius: '12px', overflow: 'hidden', border: '2px solid #2d6a4f' }}>
                    <BarcodeScanner onScanSuccess={handleBarcodeScan} />
                </div>
            )} 

            <AddItemForm
                onAddItem={handleAddItem}
                editingItem={editingItem}
                onUpdateItem={handleUpdateItem}
                onCancelEdit={() => setEditingItem(null)}
            />

            {rarelyUsedItems.length > 0 && (
                <div style={styles.warningBox}>
                    <strong>⚠️ Review Needed:</strong> You have {rarelyUsedItems.length} item(s) you haven't used in over 2 weeks.
                </div>
            )}

            <div style={styles.dashboardSection}>
                <h3 style={styles.dashboardTitle}>Inventory Dashboard</h3>
                <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
                <FilterBar categoryFilter={categoryFilter} locationFilter={locationFilter} onCategoryChange={setCategoryFilter} onLocationChange={setLocationFilter} />
                <InventoryList
                    items={filteredItems}
                    onDelete={handleDelete}
                    onEdit={setEditingItem}
                    duplicateItemIds={duplicateItemIds} // Pass duplicates down
                    timeTick={timeTick} // Pass timeTick for "Just Added" logic
                />
            </div>
           
            <div style={styles.bakingSection}>
                <BakingTracker supabaseItems={items} />
            </div>
        </div>
    )
}

const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#0f1a14", // Partner's dark forest background
        padding: "20px 16px 40px",
        color: "#e8f0ea"
    },
    headerSection: {
        textAlign: "center",
        marginBottom: "24px"
    },
    header: {
        fontFamily: "'DM Serif Display', serif", // Partner's branding font
        color: "#e8f0ea",
        fontSize: "36px",
        marginBottom: "4px",
        fontWeight: "400",
        margin: "0"
    },
    subtitle: {
        color: "rgba(232, 240, 234, 0.6)",
        fontSize: "13px",
        letterSpacing: "1px",
        textTransform: "uppercase"
    },
    warningBox: {
        maxWidth: "600px",
        margin: "0 auto 20px",
        padding: "12px",
        backgroundColor: "rgba(244, 162, 97, 0.1)",
        color: "#f4a261",
        borderRadius: "8px",
        border: "0.5px solid rgba(244, 162, 97, 0.3)",
        fontSize: "13px"
    },
    dashboardSection: {
        maxWidth: "600px",
        margin: "28px auto 0"
    },
    dashboardTitle: {
        color: "#e8f0ea",
        marginBottom: "12px",
        fontSize: "18px",
        fontWeight: "500"
    },
    bakingSection: { 
        maxWidth: "600px",
        margin: "40px auto 0", 
        borderTop: "1px solid rgba(255,255,255,0.1)", 
        paddingTop: "20px" 
    }
}

export default App