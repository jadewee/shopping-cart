let {useState, useEffect, useReducer} = React;
let {Card, Accordion, Button, Container, Row, Col, Image, Input} = ReactBootstrap;

let products = [
   {name: 'Apples', country: 'Italy', cost: 3, stock: 10},
   {name: 'Oranges', country: 'Spain', cost: 4, stock: 3},
   {name: 'Beans', country: 'USA', cost: 2, stock: 5},
   {name: 'Cabbage', country: 'USA', cost: 1, stock: 8}
]

let photos = ['apple.png', 'orange.png', 'beans.png', 'cabbage.png'];

let Cart = (props) => {
   let data = props.location.data ? props.location.data : products;
   console.log(`Data: ${JSON.stringify(data)}`);
   return (
      <Accordion defaultActiveKey="0">{list}</Accordion>
   );
}

// Custom hook.
let useDataApi = (initialUrl, initialData) => {
   let [url, setUrl] = useState(initialUrl);
   let [state, dispatch] = useReducer(dataFetchReducer, {isLoading: false, isError: false, data: initialData});

   useEffect(() => {
      let didCancel = false;
      let fetchData = async () => {
         dispatch({type: 'FETCH_INIT'});
         try {
            let result = await axios(url);
            console.log('FETCH FROM URL');
            if (!didCancel) {
               dispatch({type: 'FETCH_SUCCESS', payload: result.data.data});
            }
         }
         catch (error) {
            if (!didCancel) {
               dispatch({type: 'FETCH_FAILURE'});
            }
         }
      }
      fetchData();
      return () => {
         didCancel = true;
      }
   }, [url]);
   return [state, setUrl];
}

let dataFetchReducer = (state, action) => {
   switch (action.type) {
      case 'FETCH_INIT':
         return {
            ...state,
            isLoading: true,
            isError: false
         }
      case 'FETCH_SUCCESS':
         return {
            ...state,
            isLoading: false,
            isError: false,
            data: action.payload
         }
      case 'FETCH_FAILURE':
         return {
            ...state,
            isLoading: false,
            isError: true
         }
      default:
         throw new Error();
   }
}

let Products = () => {
   // Tracks the state of all the products.
   let [items, setItems] = useState(products);
   // Tracks the state of all the items in the shopping cart.
   let [cart, setCart] = useState([]);
   let [total, setTotal] = useState(0);
   let [query, setQuery] = useState('http://localhost:1337/api/products');
   let [{data, isLoading, isError}, doFetch] = useDataApi('http://localhost:1337/api/products', {data: []});

   // Function to add item to cart.
   let addItem = (e) => {
      let name = e.target.name;
      let item = items.filter((element, index, array) => element.name == name);
      if (item[0].stock == 0) return;
      item[0].stock = item[0].stock - 1;
      setCart([...cart, ...item]);
      console.log(`Add To Cart ${JSON.stringify(name)}`);
   }

   // Function to delete item from cart.
   let removeItem = (element, index) => {
      // Filter to keep all elements that don't have the index of the item being deleted.
      let updateCart = cart.filter((element2, index2, array2) => index != index2);
      let target = cart.filter((element3, index3, array3) => index == index3);
      if (element.name == target[0].name) {
         element.stock = element.stock + 1;
      }
      setCart(updateCart);
      console.log(`Remove Item ${JSON.stringify(element.name)}`);
   }

   // Map through the products and create the images, buttons, and inputs to add them to the shopping cart.
   let list = items.map((element, index, array) => {
      return (
         <li key={index}>
            <Image src={photos[index]} width={75} roundedCircle></Image>
            <Button variant="primary" size="large">{element.name}: {element.stock}</Button>
            <input name={element.name} type="submit" onClick={addItem}/>
         </li>
      );
   });

   // List of cart items.
   let cartList = cart.map((element, index, array) => {
      return (
         <Accordion.Item key={index + 1}>
            <Accordion.Header>{element.name}</Accordion.Header>
            <Accordion.Body onClick={() => removeItem(element, index)}><Button>Remove Item</Button></Accordion.Body>
         </Accordion.Item>
      );
   })

   let restockProducts = (url) => {
      doFetch(url);
      let newItems = data.map((element, index, array) => {
         let {name, country, cost, stock} = element;
         return {name, country, cost, stock};
      })
      setItems([...items, ...newItems]);
   }

   let checkout = () => {
      let costs = cart.map((element, index, array) => element.cost);
      let reducer = (accumulated, current) => accumulated + current;
      let newTotal = costs.reduce(reducer, 0);
      return newTotal;
   }

   let finalList = () => {
      let total = checkout();
      let final = cart.map((element, index, array) => {
         return (
            <div key={index} index={index}>{element.name}</div>
         );
      })
      return {final, total};
   }

   return (
    <Container>
      <Row>
        <div class="header">
          <h1>Shopping Cart</h1>
        </div>
      </Row>
      <div class="layout">
        <Row>
            <Col>
                <h2>Products</h2>
                <ul style={{listStyleType: "none"}}>{list}</ul>
            </Col>
            <Col>
                <h2>Cart</h2>
                <Accordion defaultActiveKey="0">{cartList}</Accordion>
            </Col>
            <Col>
                <h2>Total</h2>
                <Button onClick={checkout}>Checkout ${finalList().total}</Button>
                <div>{finalList().total > 0 && finalList().final}</div>
            </Col>
        </Row>
        </div>
        <Row>
         <div class="layout">
            <form onSubmit={(e) => {
                restockProducts(`http://localhost:1337/api/${query}`);
                console.log(`Restock Called On: ${query}`);
                e.preventDefault();
            }}>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}/>
                <button type="submit">Restock</button>
            </form>
          </div>
        </Row>
    </Container>
   );
}

let root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Products/>);