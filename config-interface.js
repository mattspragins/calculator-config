// Define our UI components first
const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => (
    <div className="p-6 border-b border-gray-200">{children}</div>
);

const CardTitle = ({ children }) => (
    <h2 className="text-2xl font-bold">{children}</h2>
);

const CardContent = ({ children }) => (
    <div className="p-6">{children}</div>
);

const Button = ({ children, onClick, className = '', disabled = false }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 ${className}`}
    >
        {children}
    </button>
);

const Input = ({ type = 'text', value, onChange, className = '' }) => (
    <input 
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full p-2 border rounded ${className}`}
    />
);

const Label = ({ children }) => (
    <label className="block mb-2 font-medium">{children}</label>
);

// Main Configuration Interface Component
const ConfigInterface = () => {
    const [config, setConfig] = React.useState({
        materialRates: {
            vinyl: {
                buildingsPerDay: 6,
                pricePerBuilding: 450,
                description: "Standard vinyl siding"
            },
            hardie: {
                buildingsPerDay: 5,
                pricePerBuilding: 565,
                description: "HardiePlank fiber cement siding"
            }
        },
        heightMultipliers: {
            "2": {
                timeMultiplier: 1.0,
                priceMultiplier: 1.0
            },
            "3": {
                timeMultiplier: 0.6,
                priceMultiplier: 1.67
            },
            "4": {
                timeMultiplier: 0.5,
                priceMultiplier: 2.0
            }
        },
        settings: {
            baselineRevenue: 2250,
            minBuildingsPerDay: 1,
            roundingPrecision: 100,
            scaleMultiplierPrecision: 2
        }
    });

    const [githubConfig, setGithubConfig] = React.useState({
        token: localStorage.getItem('githubToken') || '',
        owner: localStorage.getItem('githubOwner') || '',
        repo: localStorage.getItem('githubRepo') || '',
        branch: localStorage.getItem('githubBranch') || 'main',
        path: 'config.js'
    });

    const [status, setStatus] = React.useState({ loading: false, message: '', error: false });
    const [activeTab, setActiveTab] = React.useState('materials');

    // GitHub Integration Functions
    const encode = (str) => {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
        }));
    };

    const getFileSHA = async () => {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`,
                {
                    headers: {
                        'Authorization': `token ${githubConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            const data = await response.json();
            return data.sha;
        } catch (error) {
            console.error('Error getting file SHA:', error);
            return null;
        }
    };

    const saveToGitHub = async () => {
        setStatus({ loading: true, message: 'Saving to GitHub...', error: false });
        
        try {
            const sha = await getFileSHA();
            const content = `const calculatorConfig = ${JSON.stringify(config, null, 2)};\n\nexport default calculatorConfig;`;
            
            const response = await fetch(
                `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${githubConfig.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: 'Update calculator configuration',
                        content: encode(content),
                        sha: sha,
                        branch: githubConfig.branch
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to save to GitHub');

            setStatus({ loading: false, message: 'Successfully saved to GitHub!', error: false });
            setTimeout(() => setStatus({ loading: false, message: '', error: false }), 3000);
        } catch (error) {
            setStatus({ loading: false, message: 'Error saving to GitHub: ' + error.message, error: true });
        }
    };

    // Configuration Update Functions
    const addMaterial = () => {
        const newMaterial = prompt("Enter new material name:");
        if (newMaterial && !config.materialRates[newMaterial]) {
            setConfig({
                ...config,
                materialRates: {
                    ...config.materialRates,
                    [newMaterial]: {
                        buildingsPerDay: 4,
                        pricePerBuilding: 500,
                        description: "New material type"
                    }
                }
            });
        }
    };

    const deleteMaterial = (material) => {
        if (window.confirm(`Are you sure you want to delete ${material}?`)) {
            const newMaterialRates = { ...config.materialRates };
            delete newMaterialRates[material];
            setConfig({
                ...config,
                materialRates: newMaterialRates
            });
        }
    };

    const updateMaterialRate = (material, field, value) => {
        setConfig({
            ...config,
            materialRates: {
                ...config.materialRates,
                [material]: {
                    ...config.materialRates[material],
                    [field]: field === 'description' ? value : Number(value)
                }
            }
        });
    };

    const updateHeightMultiplier = (stories, field, value) => {
        setConfig({
            ...config,
            heightMultipliers: {
                ...config.heightMultipliers,
                [stories]: {
                    ...config.heightMultipliers[stories],
                    [field]: Number(value)
                }
            }
        });
    };

    const updateSetting = (setting, value) => {
        setConfig({
            ...config,
            settings: {
                ...config.settings,
                [setting]: Number(value)
            }
        });
    };

    const saveGitHubSettings = () => {
        localStorage.setItem('githubToken', githubConfig.token);
        localStorage.setItem('githubOwner', githubConfig.owner);
        localStorage.setItem('githubRepo', githubConfig.repo);
        localStorage.setItem('githubBranch', githubConfig.branch);
        setStatus({ loading: false, message: 'GitHub settings saved!', error: false });
        setTimeout(() => setStatus({ loading: false, message: '', error: false }), 3000);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Calculator Configuration</CardTitle>
                {status.message && (
                    <div className={`mt-4 p-2 rounded ${status.error ? 'bg-red-100' : 'bg-green-100'}`}>
                        {status.message}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <div className="flex space-x-4 border-b">
                        {['materials', 'height', 'settings', 'github'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 ${activeTab === tab 
                                    ? 'border-b-2 border-blue-500 text-blue-500' 
                                    : 'text-gray-500'}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'materials' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Material Types</h3>
                            <Button onClick={addMaterial}>Add Material</Button>
                        </div>
                        
                        {Object.entries(config.materialRates).map(([material, rates]) => (
                            <div key={material} className="p-4 border rounded-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium capitalize">{material}</h4>
                                    <Button 
                                        onClick={() => deleteMaterial(material)}
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        Delete
                                    </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Buildings Per Day</Label>
                                        <Input
                                            type="number"
                                            value={rates.buildingsPerDay}
                                            onChange={(e) => updateMaterialRate(material, 'buildingsPerDay', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Price Per Building ($)</Label>
                                        <Input
                                            type="number"
                                            value={rates.pricePerBuilding}
                                            onChange={(e) => updateMaterialRate(material, 'pricePerBuilding', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            type="text"
                                            value={rates.description}
                                            onChange={(e) => updateMaterialRate(material, 'description', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'height' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Height Adjustments</h3>
                        
                        {Object.entries(config.heightMultipliers).map(([stories, multipliers]) => (
                            <div key={stories} className="p-4 border rounded-lg">
                                <h4 className="font-medium mb-4">{stories} Stories</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Time Multiplier</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={multipliers.timeMultiplier}
                                            onChange={(e) => updateHeightMultiplier(stories, 'timeMultiplier', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Price Multiplier</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={multipliers.priceMultiplier}
                                            onChange={(e) => updateHeightMultiplier(stories, 'priceMultiplier', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">General Settings</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Baseline Daily Revenue ($)</Label>
                                <Input
