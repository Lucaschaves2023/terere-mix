-- ============================================
--  Tereré Mix — Seed de Produtos Reais
--  Atualizado com o cardápio real da loja
-- ============================================

INSERT INTO produtos (nome, descricao, preco, categoria, imagem, estoque) VALUES

-- ── Torres de Tereré ─────────────────────────────────────────────
('Torre de Tereré 2,5L - Limonada',         'Torre de tereré sabor limonada, tamanho 2,5L.',                                             23.00, 'Torres de Tereré',   'assets/images/torre-limonada.png',   50),
('Torre de Tereré 2,5L - Vitamina C',        'Torre de tereré sabor vitamina C, feita com limonada e laranja, tamanho 2,5L.',            28.00, 'Torres de Tereré',   'assets/images/torre-vitaminac.png',  50),
('Torre de Tereré 3,5L - Limonada',         'Torre de tereré sabor limonada, tamanho 3,5L.',                                             30.00, 'Torres de Tereré',   'assets/images/torre-limonada.png',   30),
('Torre de Tereré 3,5L - Vitamina C',        'Torre de tereré sabor vitamina C, feita com limonada e laranja, tamanho 3,5L.',            35.00, 'Torres de Tereré',   'assets/images/torre-vitaminac.png',  30),
('Limonada 1L',                              'Tereré sabor limonada, tamanho 1L.',                                                        13.00, 'Torres de Tereré',   'assets/images/limonada.png',         80),
('Limonada 1,5L',                            'Tereré sabor limonada, tamanho 1,5L.',                                                      18.00, 'Torres de Tereré',   'assets/images/limonada.png',         80),
('Limonada com Laranja 1,5L',                'Tereré sabor limonada com laranja, tamanho 1,5L.',                                          23.00, 'Torres de Tereré',   'assets/images/torre-vitaminac.png',  60),
('Laranja 1L',                               'Tereré sabor laranja, tamanho 1L.',                                                         16.00, 'Torres de Tereré',   'assets/images/torre-vitaminac.png',  60),
('Laranja 500ml',                            'Tereré sabor laranja, tamanho 500ml.',                                                      10.00, 'Torres de Tereré',   'assets/images/limonada.png',         80),

-- ── Ervas ─────────────────────────────────────────────────────────
('Menta Black',                              'Erva especial sabor menta black.',                                                           6.00, 'Ervas',              'assets/images/erva.png',            100),
('Double Black',                             'Erva double black com menta e hortelã.',                                                     6.00, 'Ervas',              'assets/images/erva.png',            100),
('Abacaxi + Hortelã + Gengibre',             'Blend de ervas com abacaxi, hortelã e gengibre.',                                           6.00, 'Ervas',              'assets/images/erva.png',            100),
('Menta & Boldo',                            'Erva blend com menta e boldo.',                                                              6.00, 'Ervas',              'assets/images/erva.png',            100),
('Burrito',                                  'Erva-mate pura folha com leve amentolado e hortelã.',                                        6.00, 'Ervas',              'assets/images/erva.png',            100),
('Menta Paraguaia',                          'Erva especial menta paraguaia.',                                                             6.00, 'Ervas',              'assets/images/erva.png',            100),
('Menta & Limão',                            'Erva blend com menta e limão.',                                                              6.00, 'Ervas',              'assets/images/erva.png',            100),
('Eucalipto',                                'Erva especial sabor eucalipto.',                                                             6.00, 'Ervas',              'assets/images/erva.png',            100),
('Cereja Ice',                               'Erva especial sabor cereja ice.',                                                            6.00, 'Ervas',              'assets/images/erva.png',            100),
('Lemon Blend',                              'Erva blend de limões.',                                                                      6.00, 'Ervas',              'assets/images/erva.png',            100),
('Hortelã Ice',                              'Erva especial sabor hortelã ice.',                                                           6.00, 'Ervas',              'assets/images/erva.png',            100),
('Fit',                                      'Blend com boldo, limão, cravo da índia, gengibre, menta, hortelã e canela.',                6.00, 'Ervas',              'assets/images/erva.png',            100),
('Limão Caipira',                            'Sabor limão caipira (limão rosa/cravo), toque azedo com aroma de tangerina.',               6.00, 'Ervas',              'assets/images/erva.png',            100),
('Limão da Roça',                            'Erva especial sabor limão da roça.',                                                         6.00, 'Ervas',              'assets/images/erva.png',            100),
('Energético',                               'Erva especial sabor energético.',                                                            6.00, 'Ervas',              'assets/images/erva.png',            100),

-- ── Sobremesas ────────────────────────────────────────────────────
('Mini Pudim',                               'Mini pudim de leite condensado com calda de caramelo.',                                      7.00, 'Sobremesas',         'assets/images/mini-pudim.png',       30),
('Picolé Premium Chocolate',                 'Picolé premium sabor chocolate.',                                                           10.00, 'Sobremesas',         'assets/images/picole-chocolate.png', 40),
('Morango com Chocolate',                    'Morango com cobertura de chocolate.',                                                       10.00, 'Sobremesas',         'assets/images/picole-chocolate.png', 40),

-- ── Salgados e Porções ────────────────────────────────────────────
('Batata Frita P',                           'Porção de batata frita tamanho P.',                                                         15.00, 'Salgados e Porções', 'assets/images/salgado.png',          50),
('Batata Frita M',                           'Porção de batata frita tamanho M.',                                                         25.00, 'Salgados e Porções', 'assets/images/salgado.png',          50),
('Anel de Cebola',                           'Anéis de cebola crocantes (onion rings), 10 unidades.',                                     13.00, 'Salgados e Porções', 'assets/images/salgado.png',          40),
('Kikão',                                    'Lanche especial da casa.',                                                                   6.00, 'Salgados e Porções', 'assets/images/salgado.png',          50),
('Combo Salgadinhos',                        'Combo com 15 salgadinhos (5 de cada sabor).',                                              16.00, 'Salgados e Porções', 'assets/images/salgado.png',          30),
('Mini Chicken',                             'Mini pedaços de frango crocante, 10 unidades.',                                            15.00, 'Salgados e Porções', 'assets/images/salgado.png',          40),
('Mini Croquete de Carne',                   'Mini croquetes de carne, 10 unidades.',                                                    13.00, 'Salgados e Porções', 'assets/images/salgado.png',          40),
('Mini Kibe',                                'Mini kibes crocantes, 10 unidades.',                                                       13.00, 'Salgados e Porções', 'assets/images/salgado.png',          40),
('Mini Bolinha de Queijo',                   'Mini bolinhas de queijo derretido, 10 unidades.',                                          13.00, 'Salgados e Porções', 'assets/images/salgado.png',          40),
('Mini Coxinha de Frango com Requeijão',     'Mini coxinhas de frango com requeijão cremoso, 10 unidades.',                             13.00, 'Salgados e Porções', 'assets/images/salgado.png',          40);
