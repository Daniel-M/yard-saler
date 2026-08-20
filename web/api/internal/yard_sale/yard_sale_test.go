package yard_sale_test

import (
	"context"
	"database/sql"
	"testing"

	"github.com/Daniel-M/ys-api/internal/database"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/Daniel-M/ys-api/internal/yard_sale"
	_ "github.com/mattn/go-sqlite3"
)

func setupTestDB(t *testing.T) *sql.DB {
	db, err := database.NewSqliteConnection(":memory:")
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	if err := database.RunMigrations(db); err != nil {
		db.Close()
		t.Fatalf("failed to run migrations: %v", err)
	}

	return db
}

func TestYardSaleService(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	repo := yard_sale.NewSqliteRepository(db)
	svc := yard_sale.NewService(repo)

	ctx := context.Background()

	// 1. Create a Yard Sale
	createDTO := dto.CreateYardSaleDTO{
		Title:       "Huge moving sale",
		Description: "Selling tools and furniture",
		Location:    "123 Street",
		StartDate:   "2026-08-22T08:00:00Z",
		EndDate:     "2026-08-23T17:00:00Z",
	}

	ys, err := svc.CreateYardSale(ctx, "usr_owner_1", createDTO)
	if err != nil {
		t.Fatalf("failed to create yard sale: %v", err)
	}

	if ys.Title != createDTO.Title {
		t.Errorf("expected Title %q, got %q", createDTO.Title, ys.Title)
	}

	// 2. Fetch Detail (should have 0 products initially)
	ysDetail, prods, err := svc.GetYardSaleDetail(ctx, ys.ID)
	if err != nil {
		t.Fatalf("failed to fetch yard sale: %v", err)
	}
	if ysDetail.ID != ys.ID {
		t.Errorf("expected ID %q, got %q", ys.ID, ysDetail.ID)
	}
	if len(prods) != 0 {
		t.Errorf("expected 0 products, got %d", len(prods))
	}

	// 3. Add a Product
	prodDTO := dto.CreateProductDTO{
		Name:        "Oak Table",
		Description: "Sturdy oak table",
		Price:       25000,
		Condition:   "good",
		Status:      "available",
		Images:      []string{"/uploads/img.jpg"},
	}

	// Attempt adding product with wrong user ID (should fail with ErrForbidden)
	_, err = svc.AddProduct(ctx, "usr_wrong_user", ys.ID, prodDTO)
	if err == nil {
		t.Error("expected error when adding product from non-owner, got nil")
	}

	// Add product with owner ID (should succeed)
	prod, err := svc.AddProduct(ctx, "usr_owner_1", ys.ID, prodDTO)
	if err != nil {
		t.Fatalf("failed to add product: %v", err)
	}

	if prod.Name != prodDTO.Name {
		t.Errorf("expected Product Name %q, got %q", prodDTO.Name, prod.Name)
	}

	// 4. Fetch Detail again (should now include the product)
	_, prodsAfter, err := svc.GetYardSaleDetail(ctx, ys.ID)
	if err != nil {
		t.Fatalf("failed to fetch yard sale detail: %v", err)
	}
	if len(prodsAfter) != 1 {
		t.Fatalf("expected 1 product, got %d", len(prodsAfter))
	}
	if prodsAfter[0].ID != prod.ID {
		t.Errorf("expected product ID %q, got %q", prod.ID, prodsAfter[0].ID)
	}
}
