'use client'
import { useEffect, useState } from 'react';
import { firestore } from '@/firebase';
import { Box, Button, Modal, Stack, TextField, Typography, ButtonGroup  } from '@mui/material';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, addDoc } from 'firebase/firestore';
import dayjs from 'dayjs';

export default function Home() {
    const [inventory, setInventory] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentItemName, setCurrentItemName] = useState('');
    const [removeNOpen, setRemoveNOpen] = useState(false);
    const [requestNOpen, setRequestNOpen] = useState(false);
    const [itemName, setItemName] = useState('');
    const [itemImage, setItemImage] = useState('');
    const [requestQuantity, setRequestQuantity] = useState('');
    const [removeQuantity, setRemoveQuantity] = useState('');
    const [requestedItems, setRequestedItems] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredInventory, setFilteredInventory] = useState([]);

    const colors = {
        primaryText: '#393E29',
        secondaryText: '#D9BFB1',
        background: '#F0DED0',
        itemBackground: '#BB998E',
        buttonText: '#393E29',
        borderColor: '#393E29',
    };

    useEffect(() => {
        updateInventory();
        updateRequestedItems();
    }, []);

    useEffect(() => {
        // Filter inventory based on search query
        const queryLower = searchQuery.toLowerCase();
        setFilteredInventory(inventory.filter(item => item.name.toLowerCase().includes(queryLower)));
    }, [searchQuery, inventory]);


    const updateInventory = async () => {
        const snapshot = await getDocs(query(collection(firestore, 'inventory')));
        const inventoryList = snapshot.docs.map(doc => ({
            name: doc.id,
            ...doc.data()
        }));
        setInventory(inventoryList);
    };

    const updateRequestedItems = async () => {
        const snapshot = await getDocs(query(collection(firestore, 'requestedItems')));
        const requestedList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setRequestedItems(requestedList);
    };

    const handleItemUpdate = async (item, quantity, updateType) => {
        const docRef = doc(collection(firestore, 'inventory'), item);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const { quantity: currentQuantity, lastAdded, imageUrl } = docSnap.data();
            if (updateType === 'remove' && currentQuantity <= quantity) {
                await setDoc(docRef, { quantity: 0, lastAdded: dayjs().toISOString(), imageUrl }, { merge: true });
            } else {
                const newQuantity = updateType === 'add' ? currentQuantity + quantity : currentQuantity - quantity;
                await setDoc(docRef, { quantity: newQuantity, lastAdded: dayjs().toISOString(), imageUrl }, { merge: true });
            }
        } else if (updateType === 'add') {
            await setDoc(docRef, { quantity: quantity, lastAdded: dayjs().toISOString(), imageUrl: itemImage });
        }
        await updateInventory();
    };

    const handleRequestItem = async (item, quantity, imageUrl) => {
        await addDoc(collection(firestore, 'requestedItems'), {
            name: item,
            quantity: parseInt(quantity),
            date: dayjs().format('YYYY-MM-DD'),
            imageUrl
        });
        await updateRequestedItems();
    };

    const completeRequest = async (id, name, quantity) => {
        await handleItemUpdate(name, quantity, 'add');
        await deleteDoc(doc(collection(firestore, 'requestedItems'), id));
        await updateRequestedItems();
    };

    const toggleModal = (setState) => () => setState(prev => !prev);

    return (
        <Box display={"flex"}
             width="100%"
             height={"100vh"}
             flexDirection="column"
             sx={{ backgroundColor: colors.background }}>

            <Box display={"flex"} width={"100%"} height ={"4em"}
                 alignItems="center"
                 justifyContent={"space-between"}
                 sx = {{
                     backgroundColor: colors.secondaryText,
                     borderBottomRightRadius: '16px',
                     borderBottomLeftRadius: '16px'
                 }}
            >
                <Typography color={colors.primaryText} variant="h4"
                            fontWeight="bold" sx = {{marginLeft: '16px'}}> Pantry Tracker </Typography>

                <Button variant="text" onClick={toggleModal(setOpen)} sx={{color: colors.buttonText, marginRight:'16px'}}>
                    Add New Item
                </Button>
            </Box>

            <Box display="flex" flex="1" width="100%" sx={{ padding: '16px', overflow: 'hidden' }}>
                <Box display="flex"
                     flexDirection="column"
                     flex="1"
                     overflow="hidden"
                     sx={{ backgroundColor: colors.secondaryText, borderRadius: '16px', marginRight: '16px' }}>

                    <Stack spacing={2} direction={"row"} display="flex" alignItems="center" sx={{marginLeft: '16px' }}>
                        <Typography color={colors.primaryText} variant="h6"
                                    fontWeight="bold" sx = {{marginLeft: '16px'}}> Inventory </Typography>
                        <TextField
                            variant="outlined"
                            placeholder="Search for items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ color: colors.buttonText }}
                        />
                    </Stack>

                    <Stack spacing={2} overflow="auto" padding="16px">
                        {filteredInventory.map(({ name, quantity, lastAdded, imageUrl }) => (
                            <Box
                                key={name}
                                width="100%"
                                minHeight="100px"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                backgroundColor="#BB998E"
                                padding={2}
                                sx={{ borderRadius: "16px" }}
                            >
                                <Stack spacing={1} direction="column" alignItems="left">
                                    {imageUrl && <img src={imageUrl} alt={name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />}
                                    <Typography variant="h6" color={colors.primaryText} textAlign="center">
                                        {name.charAt(0).toUpperCase() + name.slice(1)}
                                    </Typography>
                                </Stack>
                                <Stack spacing ={1} direction={"column"} alignItems={"center"}>
                                    <Typography variant="h6" color={quantity === 0 ? 'red' : colors.primaryText} textAlign="center">
                                        {quantity === 0 ? 'Quantity: 0' : `Quantity: ${quantity}`}
                                    </Typography>
                                    <Typography variant="h6" color={colors.primaryText} textAlign="center">
                                        Last Added: {dayjs(lastAdded).format('YYYY-MM-DD')}
                                    </Typography>
                                </Stack>

                                <ButtonGroup orientation="vertical"
                                             sx={{
                                                 ".MuiButtonGroup-grouped:not(:last-of-type)": {
                                                     borderColor: colors.borderColor,
                                                 },
                                             }}
                                             variant="text"
                                             aria-label="text button group">
                                    <Button sx={{ color: colors.buttonText }} onClick={() => handleItemUpdate(name, 1, 'remove')}>Remove 1</Button>
                                    <Button sx={{ color: colors.buttonText }} onClick={() => handleItemUpdate(name, 5, 'remove')}>Remove 5</Button>
                                    <Button sx={{ color: colors.buttonText }} onClick={() => {
                                        setCurrentItemName(name);
                                        toggleModal(setRemoveNOpen)();
                                    }}>Remove N</Button>
                                </ButtonGroup>
                                <ButtonGroup
                                    orientation="vertical"
                                    sx={{
                                        ".MuiButtonGroup-grouped:not(:last-of-type)": {
                                            borderColor: colors.borderColor,
                                        },
                                    }}
                                    variant="text"
                                    aria-label="text button group"
                                >
                                    <Button sx={{ color: colors.buttonText }} onClick={() => handleRequestItem(name, 1, imageUrl)}>Request 1</Button>
                                    <Button sx={{ color: colors.buttonText }} onClick={() => handleRequestItem(name, 5, imageUrl)}>Request 5</Button>
                                    <Button sx={{ color: colors.buttonText }} onClick={() => {
                                        setCurrentItemName(name);
                                        setItemImage(imageUrl);
                                        toggleModal(setRequestNOpen)();
                                    }}>
                                        Request N
                                    </Button>
                                </ButtonGroup>
                            </Box>
                        ))}
                    </Stack>
                </Box>

                <Box display="flex" flexDirection="column" flex="1" sx={{ height: '100%', justifyContent: 'space-between' }}>
                    <Box display="flex" flex="1" sx={{ backgroundColor: colors.secondaryText, borderRadius: '16px', marginBottom: '16px' }}>
                        <Typography color={colors.primaryText} variant="h6"
                                    fontWeight="bold" sx = {{marginLeft: '16px'}}>A.I. Suggestions implement in future</Typography>
                    </Box>

                    <Box display="flex"
                         flexDirection="column"
                         flex="1"
                         overflow={"hidden"}
                         sx={{ backgroundColor: colors.secondaryText, borderRadius: '16px' }}>
                        <Typography color={colors.primaryText} variant="h6"
                                    fontWeight="bold" sx = {{marginLeft: '16px'}}>Requested Items</Typography>

                        <Stack spacing={2} padding="16px" overflow="auto">
                            {requestedItems.map(({ id, name, quantity, date, imageUrl }) => (
                                <Box key={id}
                                     width="100%"
                                     minHeight="100px"
                                     display="flex"
                                     alignItems="center"
                                     justifyContent="space-between"
                                     backgroundColor={colors.itemBackground}
                                     padding={2}
                                     sx={{borderRadius: "16px"}}
                                >
                                    <Stack spacing={1} direction="column" alignItems="left">
                                        {imageUrl && <img src={imageUrl} alt={name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />}
                                        <Typography color={colors.primaryText}>Name: {name}</Typography>
                                    </Stack>
                                    <Stack spacing={1} direction="column" alignItems="center">
                                        <Typography color={colors.primaryText}>Requested Quantity: {quantity}</Typography>
                                        <Typography color={colors.primaryText}>Request Date: {date}</Typography>
                                    </Stack>

                                    <Button variant="text" sx={{color: colors.buttonText }}  onClick={() => completeRequest(id, name, quantity)}>Complete</Button>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </Box>
            </Box>

            <Modal open={open} onClose={toggleModal(setOpen)}>
                <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    width={400}
                    bgcolor="white"
                    border="2px solid #000"
                    boxShadow={24}
                    p={4}
                    display="flex"
                    flexDirection="column"
                    gap={3}
                    sx={{ transform: 'translate(-50%, -50%)' }}
                >
                    <Typography variant="h6" color="black">Add Item</Typography>
                    <Stack width="100%" direction="row" spacing={2}>
                        <TextField
                            variant="outlined"
                            fullWidth
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="Item Name"
                        />
                        <TextField
                            variant="outlined"
                            fullWidth
                            value={itemImage}
                            onChange={(e) => setItemImage(e.target.value)}
                            placeholder="Image URL"
                        />
                        <Button
                            variant="outlined"
                            onClick={() => {
                                handleItemUpdate(itemName, 1, 'add');
                                setItemName('');
                                setItemImage('');
                                toggleModal(setOpen)();
                            }}
                        >
                            Add
                        </Button>
                    </Stack>
                </Box>
            </Modal>

            <Modal open={removeNOpen} onClose={toggleModal(setRemoveNOpen)}>
                <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    width={400}
                    bgcolor="white"
                    border="2px solid #000"
                    boxShadow={24}
                    p={4}
                    display="flex"
                    flexDirection="column"
                    gap={3}
                    sx={{ transform: 'translate(-50%, -50%)', borderRadius: 4 }}
                >
                    <Typography variant="h6" color="black">Remove N Items</Typography>
                    <Stack width="100%" direction="row" spacing={2}>
                        <TextField
                            variant="outlined"
                            fullWidth
                            value={removeQuantity}
                            onChange={(e) => setRemoveQuantity(e.target.value)}
                            placeholder="Quantity"
                        />
                        <Button
                            variant="outlined"
                            onClick={() => {
                                handleItemUpdate(currentItemName, parseInt(removeQuantity), 'remove');
                                setRemoveQuantity('');
                                toggleModal(setRemoveNOpen)();
                            }}
                        >
                            Remove
                        </Button>
                    </Stack>
                </Box>
            </Modal>

            <Modal open={requestNOpen} onClose={toggleModal(setRequestNOpen)}>
                <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    width={400}
                    bgcolor="white"
                    border="2px solid #000"
                    boxShadow={24}
                    p={4}
                    display="flex"
                    flexDirection="column"
                    gap={3}
                    sx={{ transform: 'translate(-50%, -50%)', borderRadius: 4 }}
                >
                    <Typography variant="h6" color="black">Request N Items</Typography>
                    <Stack width="100%" direction="row" spacing={2}>
                        <TextField
                            variant="outlined"
                            fullWidth
                            value={requestQuantity}
                            onChange={(e) => setRequestQuantity(e.target.value)}
                            placeholder="Quantity"
                        />
                        <Button
                            variant="outlined"
                            onClick={() => {
                                handleRequestItem(currentItemName, parseInt(requestQuantity), itemImage);
                                setRequestQuantity('');
                                toggleModal(setRequestNOpen)();
                            }}
                        >
                            Request
                        </Button>
                    </Stack>
                </Box>
            </Modal>
        </Box>
    );
}
