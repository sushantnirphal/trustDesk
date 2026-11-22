package com.trustdesk.customer;

import com.trustdesk.entity.Customer;

import java.util.List;

public interface CustomerService {

    List<Customer> findAll();

    Customer findById(Long id);
}
