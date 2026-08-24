const products = [
  // MEN
  {
    id: "M001",
    name: "Basic T-Shirt",
    category: "men",
    price: 250,
    colors: ["Black", "White", "Blue"],
    sizes: ["S", "M", "L", "XL"],
    stock: {
      Black: { S: 10, M: 5, L: 3, XL: 2 },
      White: { S: 8, M: 6, L: 4, XL: 2 },
      Blue: { S: 7, M: 5, L: 5, XL: 1 }
    }
  },
  {
    id: "M002",
    name: "Denim Jacket",
    category: "men",
    price: 850,
    colors: ["Blue", "Black"],
    sizes: ["M", "L", "XL"],
    stock: {
      Blue: { M: 5, L: 3, XL: 2 },
      Black: { M: 4, L: 2, XL: 1 }
    }
  },
  {
    id: "M003",
    name: "Jogger Pants",
    category: "men",
    price: 400,
    colors: ["Gray", "Black"],
    sizes: ["S", "M", "L"],
    stock: {
      Gray: { S: 5, M: 4, L: 3 },
      Black: { S: 6, M: 5, L: 2 }
    }
  },

  // WOMEN
  {
    id: "W001",
    name: "Summer Dress",
    category: "women",
    price: 600,
    colors: ["Red", "Pink"],
    sizes: ["S", "M", "L"],
    stock: {
      Red: { S: 5, M: 4, L: 3 },
      Pink: { S: 6, M: 5, L: 2 }
    }
  },
  {
    id: "W002",
    name: "Blouse",
    category: "women",
    price: 350,
    colors: ["White", "Black"],
    sizes: ["S", "M", "L"],
    stock: {
      White: { S: 5, M: 4, L: 3 },
      Black: { S: 6, M: 5, L: 2 }
    }
  },
  {
    id: "W003",
    name: "Jeans",
    category: "women",
    price: 700,
    colors: ["Blue"],
    sizes: ["S", "M", "L"],
    stock: {
      Blue: { S: 5, M: 4, L: 3 }
    }
  },

  // KIDS
  {
    id: "K001",
    name: "Kids T-Shirt",
    category: "kids",
    price: 150,
    colors: ["Yellow", "Blue"],
    sizes: ["XS", "S", "M"],
    stock: {
      Yellow: { XS: 5, S: 4, M: 3 },
      Blue: { XS: 6, S: 5, M: 2 }
    }
  },
  {
    id: "K002",
    name: "Kids Hoodie",
    category: "kids",
    price: 300,
    colors: ["Red"],
    sizes: ["S", "M"],
    stock: {
      Red: { S: 5, M: 4 }
    }
  },
  {
    id: "K003",
    name: "Kids Pants",
    category: "kids",
    price: 200,
    colors: ["Gray"],
    sizes: ["S", "M"],
    stock: {
      Gray: { S: 5, M: 4 }
    }
  }
];